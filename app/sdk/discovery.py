from __future__ import annotations

import importlib
import logging
import os
import pkgutil
import sys
from pathlib import Path

import app.addons as core_addons_package
from app.core.config import settings

logger = logging.getLogger(__name__)

ADDONS_DIR_NAME = "addons"


def custom_repo_roots() -> list[Path]:
    """Every customization repo root configured for this instance, in precedence order."""
    return [
        Path(entry.strip())
        for entry in (settings.custom_path or "").split(os.pathsep)
        if entry.strip()
    ]


def custom_addons_dirs() -> list[Path]:
    """The addons/ directory of each configured customization repo that actually exists."""
    dirs: list[Path] = []
    for root in custom_repo_roots():
        addons_dir = root / ADDONS_DIR_NAME
        if addons_dir.is_dir():
            dirs.append(addons_dir)
        else:
            logger.warning("Customization repo '%s' has no %s/ directory", root, ADDONS_DIR_NAME)
    return dirs


def _assert_core_addons_sealed() -> None:
    """app/addons is product packaging, not an extension point. A client module found there
    would be invisible to the customization repo's version control, so refuse to boot."""
    stray = sorted(module.name for module in pkgutil.iter_modules(core_addons_package.__path__))
    if stray:
        raise RuntimeError(
            f"app/addons is sealed and must stay empty, but contains: {', '.join(stray)}. "
            "Customization Gate 1 rules belong in the external customization repo, under "
            "<FORMCRAFT_CUSTOM_PATH>/addons. Move them there and restart."
        )


def load_addons() -> None:
    """Customization Gate 1 discovery: import every module in the mounted customization
    repo(s) once at startup so its top-level register_handler(...) call runs. No core file
    changes when a client adds, changes or drops a rule — only their own repo changes."""
    _assert_core_addons_sealed()

    dirs = custom_addons_dirs()
    if not dirs:
        logger.info("No customization repo addons directory configured (FORMCRAFT_CUSTOM_PATH)")
        return

    for addons_dir in dirs:
        path = str(addons_dir)
        # Appended, not prepended: an addon must never shadow a stdlib or app module.
        if path not in sys.path:
            sys.path.append(path)
        for module in pkgutil.iter_modules([path]):
            importlib.import_module(module.name)
            logger.info("Loaded custom addon '%s' from %s", module.name, path)
