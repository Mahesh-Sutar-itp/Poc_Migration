import logging
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.exceptions import EntityNotFoundException, FormCraftException, FormulationException

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(EntityNotFoundException)
    def handle_entity_not_found(request: Request, exc: EntityNotFoundException):
        return JSONResponse(status_code=404, content={
            "type": "about:blank", "title": "Not Found", "status": 404,
            "detail": exc.message,
            "entityType": exc.entity_type, "entityId": str(exc.entity_id),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    @app.exception_handler(FormulationException)
    def handle_formulation(request: Request, exc: FormulationException):
        logger.error(f"Formulation failed for product={exc.product_id}", exc_info=exc)
        return JSONResponse(status_code=422, content={
            "type": "about:blank", "title": "Unprocessable Entity", "status": 422,
            "detail": exc.message,
            "productId": exc.product_id, "chainId": exc.chain_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    @app.exception_handler(FormCraftException)
    def handle_formcraft(request: Request, exc: FormCraftException):
        return JSONResponse(status_code=400, content={
            "type": "about:blank", "title": "Bad Request", "status": 400,
            "detail": exc.message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    @app.exception_handler(Exception)
    def handle_generic(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=exc)
        return JSONResponse(status_code=500, content={
            "type": "about:blank", "title": "Internal Server Error", "status": 500,
            "detail": "An unexpected error occurred",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
