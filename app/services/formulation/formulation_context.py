from __future__ import annotations

from dataclasses import dataclass, field

from app.models.composition_line import CompositionLine
from app.models.product import Product


@dataclass
class FormulationContext:
    product: Product
    chain_id: str
    composition_lines: list[CompositionLine]

    computed_nutrients: dict[str, float] = field(default_factory=dict)
    attributes: dict[str, object] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    nutri_score: str | None = None
    eco_score: str | None = None
    total_cost: float = 0.0
    formula_result: float = 0.0
    aborted: bool = False

    def add_error(self, error: str) -> None:
        self.errors.append(error)

    def add_warning(self, warning: str) -> None:
        self.warnings.append(warning)

    def put_nutrient(self, key: str, value: float) -> None:
        self.computed_nutrients[key] = value

    def get_nutrient(self, key: str) -> float:
        return self.computed_nutrients.get(key, 0.0)

    def has_errors(self) -> bool:
        return len(self.errors) > 0

    @property
    def status(self) -> str:
        if self.aborted or self.has_errors():
            return "ERROR"
        if self.warnings:
            return "WARNING"
        return "OK"

    @property
    def errors_summary(self) -> str:
        return "; ".join(self.errors)

    @property
    def warnings_summary(self) -> str:
        return "; ".join(self.warnings)
