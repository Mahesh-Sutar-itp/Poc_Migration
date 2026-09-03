"""V2 PLM expansion

Revision ID: 0002
Revises: 0001
Create Date: 2024-01-01 00:00:01.000000
"""
from pathlib import Path

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

_SQL_DIR = Path("/app/sql")


def upgrade() -> None:
    sql = (_SQL_DIR / "V2__plm_expansion.sql").read_text()
    op.execute(sql)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS notifications CASCADE")
    op.execute("DROP TABLE IF EXISTS stock_movements CASCADE")
    op.execute("DROP TABLE IF EXISTS stock_lots CASCADE")
    op.execute("DROP TABLE IF EXISTS documents CASCADE")
    op.execute("DROP TABLE IF EXISTS project_milestones CASCADE")
    op.execute("DROP TABLE IF EXISTS project_products CASCADE")
    op.execute("DROP TABLE IF EXISTS projects CASCADE")
    op.execute("DROP TABLE IF EXISTS change_requests CASCADE")
    op.execute("DROP TABLE IF EXISTS corrective_actions CASCADE")
    op.execute("DROP TABLE IF EXISTS non_conformances CASCADE")
    op.execute("DROP TABLE IF EXISTS specifications CASCADE")
    op.execute("DROP TABLE IF EXISTS supplier_products CASCADE")
    op.execute("DROP TABLE IF EXISTS suppliers CASCADE")
    op.execute("DROP TABLE IF EXISTS users CASCADE")
