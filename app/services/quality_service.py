import math
from sqlalchemy.orm import Session
from app.core.constants import CHECK_ALLERGEN, CHECK_COMPOSITION, CHECK_COST, ALLERGEN_GLUTEN, ALLERGEN_EGGS, ALLERGEN_MILK, ALLERGEN_NUTS, ALLERGEN_SOY
from app.core.exceptions import EntityNotFoundException
from app.enums.quality_check_status import QualityCheckStatus
from app.models.quality_check import QualityCheck
from app.repositories import composition_line_repository, product_repository, quality_check_repository


def run_all_checks(db: Session, product_id: int) -> list[QualityCheck]:
    return [
        run_check(db, product_id, CHECK_COMPOSITION),
        run_check(db, product_id, CHECK_ALLERGEN),
        run_check(db, product_id, CHECK_COST),
    ]


def run_check(db: Session, product_id: int, check_type: str) -> QualityCheck:
    product = product_repository.find_by_id(db, product_id)
    if not product:
        raise EntityNotFoundException("Product", product_id)
    check = QualityCheck()
    check.product_id = product_id
    check.product = product
    check.check_type = check_type
    if check_type == CHECK_COMPOSITION:
        _composition_check(db, check, product_id)
    elif check_type == CHECK_ALLERGEN:
        _allergen_check(db, check, product, product_id)
    elif check_type == CHECK_COST:
        _cost_check(check, product)
    else:
        check.status = QualityCheckStatus.FAILED.value
        check.result = f"Unknown check type: {check_type}"
    saved = quality_check_repository.save(db, check)
    db.commit()
    return saved


def get_checks_for_product(db: Session, product_id: int) -> list[QualityCheck]:
    return quality_check_repository.find_by_product_id(db, product_id)


def _composition_check(db: Session, check: QualityCheck, product_id: int):
    lines = composition_line_repository.find_by_product_id_with_ingredient(db, product_id)
    if not lines:
        check.status = QualityCheckStatus.FAILED.value
        check.result = "Product has no composition lines"
        return
    total_pct = sum(float(l.quantity) / 100.0 for l in lines if l.quantity) * 100.0
    deviation = abs(total_pct - 100.0)
    if deviation > 1.0:
        check.status = QualityCheckStatus.FAILED.value
        check.result = f"Composition total is {total_pct:.2f}% — must be 100%"
    else:
        check.status = QualityCheckStatus.PASSED.value
        check.result = f"Composition total: {total_pct:.4f}% ✓"


def _allergen_check(db: Session, check: QualityCheck, product, product_id: int):
    lines = composition_line_repository.find_by_product_id_with_ingredient(db, product_id)
    declared = product.allergen_flags or ""
    issues = []
    for allergen in [ALLERGEN_GLUTEN, ALLERGEN_EGGS, ALLERGEN_MILK, ALLERGEN_NUTS, ALLERGEN_SOY]:
        in_ingredients = any(l.ingredient and l.ingredient.allergen_flags and allergen in l.ingredient.allergen_flags for l in lines)
        is_declared = allergen in declared
        if in_ingredients and not is_declared:
            issues.append(f"UNDECLARED: {allergen}")
    if not issues:
        check.status = QualityCheckStatus.PASSED.value
        check.result = "All allergens correctly declared ✓"
    else:
        check.status = QualityCheckStatus.FAILED.value
        check.result = "Allergen issues: " + ", ".join(issues)


def _cost_check(check: QualityCheck, product):
    if product.cost_per_kg and float(product.cost_per_kg) > 0:
        check.status = QualityCheckStatus.PASSED.value
        check.result = f"Cost per kg: {product.cost_per_kg} ✓"
    else:
        check.status = QualityCheckStatus.FAILED.value
        check.result = "Product cost per kg is not set or zero"
