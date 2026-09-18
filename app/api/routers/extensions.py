from fastapi import APIRouter

from app.api.deps import AdminUser
from app.sdk.workflow import registered_handlers

# Read-only registry of Customization Gate 1 (ITK-style) extensions currently deployed
# on this instance. There is no "create" endpoint here on purpose — registering a new
# handler is a code+deploy action, not a runtime configuration action (see
# attribute_definitions.py / Gate 2 for the config-driven equivalent).
router = APIRouter(prefix="/api/extensions", tags=["customizations"])


@router.get("/change-request-transition-handlers")
def list_change_request_transition_handlers(user: AdminUser):
    return [
        {"className": type(handler).__name__, "packageName": type(handler).__module__}
        for handler in registered_handlers()
    ]
