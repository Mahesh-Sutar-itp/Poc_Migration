"""Customization Gate 2 — the attribute manifest kept in the client's customization repo.

Every custom column added to `products` is mirrored here, so the schema a client has grown is
versioned in their own repo rather than existing only as database state. The manifest is read
on the way in too: an attribute listed here that the database does not know about is created
at startup, which is what makes a customization repo portable across environments.
"""

from __future__ import annotations

import json
import logging
import os
import re
import tempfile
from pathlib import Path

from app.sdk.discovery import custom_repo_roots

logger = logging.getLogger(__name__)

DEFAULT_MANIFEST_NAME = "custom-product-attributes.json"
SCHEMA = "formcraft/custom-product-attributes/v1"
TABLE = "products"

# Deliberately loose: a repo that already carries e.g. "Custom_Products_Attributes.json"
# should be appended to, not shadowed by a second file.
_MANIFEST_RE = re.compile(r"^.*custom.*products?.*attributes?.*\.json$", re.IGNORECASE)
_SKIP_DIRS = {".git", "__pycache__", "node_modules"}


def manifest_path() -> Path | None:
    """The manifest to read and write, or None when no customization repo is mounted.
    An existing manifest anywhere in the repo wins; otherwise one is named at the root."""
    roots = [root for root in custom_repo_roots() if root.is_dir()]
    if not roots:
        return None

    for root in roots:
        for candidate in sorted(root.rglob("*.json")):
            if any(part in _SKIP_DIRS for part in candidate.parts):
                continue
            if _MANIFEST_RE.fullmatch(candidate.name):
                return candidate

    return roots[0] / DEFAULT_MANIFEST_NAME


def load() -> list[dict]:
    """Attribute entries currently tracked in the manifest."""
    path = manifest_path()
    if path is None or not path.is_file():
        return []
    try:
        document = json.loads(path.read_text(encoding="utf-8") or "{}")
    except json.JSONDecodeError:
        logger.exception("Custom attribute manifest at %s is not valid JSON — ignoring it", path)
        return []
    attributes = document.get("attributes")
    return [entry for entry in attributes if isinstance(entry, dict)] if isinstance(attributes, list) else []


def upsert(entry: dict) -> Path | None:
    """Appends the attribute to the manifest, replacing any entry with the same key."""
    path = manifest_path()
    if path is None:
        logger.warning(
            "No customization repo mounted (FORMCRAFT_CUSTOM_PATH) — custom attribute '%s' was "
            "added to the database but is not tracked in a manifest",
            entry.get("attributeKey"),
        )
        return None

    entries = [e for e in load() if e.get("attributeKey") != entry.get("attributeKey")]
    entries.append(entry)
    entries.sort(key=lambda e: e.get("attributeKey") or "")

    path.parent.mkdir(parents=True, exist_ok=True)
    _write_atomic(path, json.dumps({"schema": SCHEMA, "table": TABLE, "attributes": entries}, indent=2) + "\n")
    logger.info("Tracked custom attribute '%s' in %s", entry.get("attributeKey"), path)
    return path


def _write_atomic(path: Path, content: str) -> None:
    """A container restart or kill mid-write must never leave a truncated manifest behind —
    write to a temp file in the same directory and rename over the target, which POSIX and
    Windows both guarantee lands as either the old content or the new, never a partial file."""
    fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_name, path)
    except BaseException:
        os.unlink(tmp_name)
        raise
