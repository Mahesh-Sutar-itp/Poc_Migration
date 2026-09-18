FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml .
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .
COPY tests/ tests/
RUN uv pip install --system ".[dev]"

EXPOSE 8080

# The client's customization repo is mounted here, never copied into the image: Gate 1
# addons and the Gate 2 attribute manifest are read from it at runtime.
ENV FORMCRAFT_CUSTOM_PATH=/mnt/formcraft-custom
RUN mkdir -p /mnt/formcraft-custom

CMD ["python", "-m", "app.server", "--host", "0.0.0.0", "--port", "8080", "--custom-path", "/mnt/formcraft-custom"]
