FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml .
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .
COPY tests/ tests/
COPY formcraft-plm/formcraft-plm/src/main/resources/db/migration/ formcraft-plm/formcraft-plm/src/main/resources/db/migration/
RUN uv pip install --system ".[dev]"

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
