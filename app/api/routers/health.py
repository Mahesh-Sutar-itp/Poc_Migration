from fastapi import APIRouter

router = APIRouter(prefix="/api")


@router.get("/health")
def health():
    return {"status": "UP"}


@router.get("/info")
def info():
    return {"app": "formcraft-plm", "version": "1.0.0"}
