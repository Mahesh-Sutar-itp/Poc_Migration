from __future__ import annotations

import importlib
import pkgutil

import app.addons as addons_package


def load_addons() -> None:
    """The Python equivalent of Spring's component scan for Customization Gate 1:
    imports every module under app.addons once at startup so its top-level
    register_handler(...) call runs, without any core file needing to change."""
    for module in pkgutil.iter_modules(addons_package.__path__, addons_package.__name__ + "."):
        importlib.import_module(module.name)
