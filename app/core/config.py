from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "formcraft-plm"
    app_version: str = "1.0.0"

    database_url: str = "postgresql://formcraft:formcraft123@localhost:5432/formcraft"
    db_pool_size: int = 10
    db_pool_min: int = 2
    db_pool_timeout: int = 30

    jwt_secret: str = "formcraft-plm-dev-secret-key-please-override-in-production-min-256-bits"
    jwt_expiration_ms: int = 86400000

    max_upload_size: int = 10 * 1024 * 1024  # 10 MB

    model_config = {"env_prefix": "FORMCRAFT_", "env_nested_delimiter": "__", "extra": "ignore"}


settings = Settings()
