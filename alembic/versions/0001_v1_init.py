"""V1 init schema

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from pathlib import Path

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

_SQL_DIR = Path(__file__).resolve().parents[3] / "formcraft-plm" / "formcraft-plm" / "src" / "main" / "resources" / "db" / "migration"


def upgrade() -> None:
    sql = (_SQL_DIR / "V1__init.sql").read_text()
    op.execute(sql)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS audit_logs CASCADE")
    op.execute("DROP TABLE IF EXISTS quality_checks CASCADE")
    op.execute("DROP TABLE IF EXISTS workflow_tasks CASCADE")
    op.execute("DROP TABLE IF EXISTS formulation_results CASCADE")
    op.execute("DROP TABLE IF EXISTS nutrient_values CASCADE")
    op.execute("DROP TABLE IF EXISTS composition_lines CASCADE")
    op.execute("DROP TABLE IF EXISTS products CASCADE")
