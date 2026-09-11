"""Client-specific customizations plug in here (Customization Gate 1).

Drop a module in this package that subclasses
app.sdk.workflow.ChangeRequestTransitionHandler and calls
app.sdk.workflow.register_handler(...) at import time. app.sdk.discovery.load_addons()
imports every module in this package at startup, so the handler is picked up
automatically — no other file needs to change.

No handlers are registered here by default; this gate is open but empty.
"""
