"""Sealed. Client customizations do not go here.

This package exists only so the SDK has a stable import anchor; it must stay empty.
Customization Gate 1 rules live in the external customization repo mounted at
FORMCRAFT_CUSTOM_PATH (see app/sdk/discovery.py) — app.sdk.discovery.load_addons()
refuses to start the service if a client module is found in this package.
"""
