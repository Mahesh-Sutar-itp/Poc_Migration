"""Service entrypoint.

The customization repo is injected here rather than baked into the image: whatever
--custom-path points at supplies the Gate 1 addons and the Gate 2 attribute manifest, the
same way Odoo takes --addons-path. Swapping a client's customizations is a change to the
run command and the mount, never to this repository.

    python -m app.server --custom-path /mnt/formcraft-custom --host 0.0.0.0 --port 8080
"""

from __future__ import annotations

import argparse
import logging
import os
from pathlib import Path

import uvicorn

REPO_ROOT = Path(__file__).resolve().parents[1]


def _migrate() -> None:
    """Brings the database up to head before the port opens. Alembic tracks what it has
    already applied, so this is a no-op on every boot after the first."""
    from alembic import command
    from alembic.config import Config

    command.upgrade(Config(str(REPO_ROOT / "alembic.ini")), "head")


def main() -> None:
    parser = argparse.ArgumentParser(prog="formcraft", description=__doc__)
    parser.add_argument(
        "--custom-path",
        default=os.getenv("FORMCRAFT_CUSTOM_PATH", ""),
        help="Customization repo root(s), separated by the platform path separator",
    )
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--reload", action="store_true")
    parser.add_argument(
        "--no-migrate",
        action="store_true",
        help="Skip the alembic upgrade and assume the schema is already at head",
    )
    args = parser.parse_args()

    # Exported rather than handed over in-process, so uvicorn's reloader and worker
    # subprocesses — which re-import the app from scratch — see the same repo.
    os.environ["FORMCRAFT_CUSTOM_PATH"] = args.custom_path

    # Before basicConfig: alembic's own fileConfig would otherwise disable the loggers
    # configured here.
    if not args.no_migrate:
        _migrate()

    # force=True: alembic/env.py's fileConfig(alembic.ini) already attached a handler to the
    # root logger during _migrate() above, at level WARN — without force, basicConfig() is a
    # no-op (stdlib rule: it does nothing once the root logger has handlers), which would
    # silently swallow the addon-load and Gate 2 sync INFO logs below.
    logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s", force=True)

    uvicorn.run("app.main:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
