import math
from sqlalchemy.orm import Session
from app.core.constants import *
from app.enums.capa_status import CapaStatus
from app.enums.change_request_status import ChangeRequestStatus
from app.enums.nc_status import NcStatus
from app.enums.product_state import ProductState
from app.enums.product_type import ProductType
from app.enums.project_status import ProjectStatus
from app.enums.quality_check_status import QualityCheckStatus
from app.repositories import (change_request_repository, composition_line_repository, corrective_action_repository,
                               non_conformance_repository, product_repository, project_repository, quality_check_repository)
from app.services import audit_service, inventory_service, notification_service


# DERIVED-FROM-SERVICE: getDashboardSummary
def get_dashboard_summary(db: Session, username: str | None = None) -> dict:
    summary = {
        "productsByState": {
            "draft": product_repository.count_by_state(db, ProductState.DRAFT.value),
            "inValidation": product_repository.count_by_state(db, ProductState.IN_VALIDATION.value),
            "validated": product_repository.count_by_state(db, ProductState.VALIDATED.value),
            "archived": product_repository.count_by_state(db, ProductState.ARCHIVED.value),
        },
        "openNonConformances": non_conformance_repository.count_by_status(db, NcStatus.OPEN.value) + non_conformance_repository.count_by_status(db, NcStatus.IN_PROGRESS.value),
        "pendingCorrectiveActions": corrective_action_repository.count_by_status(db, CapaStatus.OPEN.value),
        "activeChangeRequests": change_request_repository.count_by_status(db, ChangeRequestStatus.SUBMITTED.value) + change_request_repository.count_by_status(db, ChangeRequestStatus.UNDER_REVIEW.value),
        "projectsInProgress": project_repository.count_by_status(db, ProjectStatus.IN_PROGRESS.value),
        "lowStockLots": len(inventory_service.get_low_stock(db, None)),
        "unreadNotifications": notification_service.count_unread(db, username) if username else 0,
    }
    return summary


# DERIVED-FROM-SERVICE: getCostBreakdown
def get_cost_breakdown(db: Session, product_id: int) -> list[dict]:
    lines = composition_line_repository.find_by_product_id_with_ingredient(db, product_id)
    breakdown = []
    for line in lines:
        fraction = float(line.quantity) / 100.0 if line.quantity else 0.0
        cost_per_kg = line.ingredient.cost_per_kg if line.ingredient else None
        contribution = float(cost_per_kg) * fraction if cost_per_kg else 0.0
        breakdown.append({
            "ingredientId": line.ingredient.id if line.ingredient else None,
            "ingredientName": line.ingredient.name if line.ingredient else None,
            "quantity": float(line.quantity) if line.quantity else 0,
            "unit": line.unit,
            "costPerKg": float(cost_per_kg) if cost_per_kg else None,
            "contribution": math.floor(contribution * 10000.0 + 0.5) / 10000.0,
        })
    return breakdown


# DERIVED-FROM-SERVICE: getAllergenMatrix
def get_allergen_matrix(db: Session) -> dict:
    known = [ALLERGEN_GLUTEN, ALLERGEN_EGGS, ALLERGEN_MILK, ALLERGEN_NUTS, ALLERGEN_SOY, ALLERGEN_FISH, ALLERGEN_SHELLFISH, ALLERGEN_SESAME]
    products = product_repository.find_by_state_and_types(db, ProductState.VALIDATED.value,
        [ProductType.FINISHED_PRODUCT.value, ProductType.SEMI_FINISHED.value])
    if not products:
        all_products = product_repository.find_all(db, offset=0, limit=10000)
        products = [p for p in all_products if p.product_type in (ProductType.FINISHED_PRODUCT.value, ProductType.SEMI_FINISHED.value)]
    rows = []
    for p in products:
        row = {"productId": p.id, "productName": p.name}
        for allergen in known:
            row[allergen] = p.has_allergen(allergen)
        rows.append(row)
    return {"allergens": known, "products": rows}


# DERIVED-FROM-SERVICE: getQualityPassRate
def get_quality_pass_rate(db: Session) -> dict:
    passed = quality_check_repository.count_by_status(db, QualityCheckStatus.PASSED.value)
    failed = quality_check_repository.count_by_status(db, QualityCheckStatus.FAILED.value)
    total = passed + failed
    rate = (passed * 100.0) / total if total > 0 else 0.0
    return {"passed": passed, "failed": failed, "passRate": math.floor(rate * 100.0 + 0.5) / 100.0}


# DERIVED-FROM-SERVICE: getRecentActivity
def get_recent_activity(db: Session, limit: int = 20) -> list[dict]:
    logs = audit_service.get_recent_activity(db, limit)
    return [
        {"entityType": log.entity_type, "entityId": log.entity_id, "action": log.action,
         "performedBy": log.performed_by, "details": log.details,
         "performedAt": log.performed_at.isoformat() if log.performed_at else None}
        for log in logs
    ]
