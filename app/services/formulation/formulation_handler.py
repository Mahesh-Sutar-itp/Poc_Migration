from __future__ import annotations

from typing import Protocol, runtime_checkable

from app.services.formulation.formulation_context import FormulationContext


@runtime_checkable
class FormulationHandler(Protocol):
    def handle(self, context: FormulationContext) -> None: ...
    def set_next(self, next_handler: FormulationHandler) -> FormulationHandler: ...
    @property
    def handler_name(self) -> str: ...
