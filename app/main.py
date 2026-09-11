from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.errors import register_exception_handlers
from app.api.routers import (
    attribute_definitions, auth, change_requests, documents, extensions, formulation,
    health, inventory, non_conformances, notifications, products, projects, quality,
    reports, specifications, suppliers, users, workflow, workflow_tasks,
)
from app.sdk.discovery import load_addons

app = FastAPI(title="FormCraft PLM", version="1.0.0")

# Customization Gate 1 auto-discovery: import every module under app.addons so its
# handlers self-register before any request is served (see app/sdk/discovery.py).
load_addons()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Cache-Control", "Content-Type"],
)

register_exception_handlers(app)

# Public routes
app.include_router(health.router)

# Auth (login is public, /me is authenticated)
app.include_router(auth.router)

# Domain routers
app.include_router(products.router)
app.include_router(formulation.router)
app.include_router(workflow.router)
app.include_router(workflow_tasks.router)
app.include_router(quality.router)
app.include_router(specifications.router)
app.include_router(non_conformances.router)
app.include_router(change_requests.router)
app.include_router(suppliers.router)
app.include_router(inventory.router)
app.include_router(projects.router)
app.include_router(documents.router)
app.include_router(notifications.router)
app.include_router(users.router)
app.include_router(reports.router)

# Customization gates: Gate 2 (custom attribute definitions) is config, Gate 1's
# registry (extensions) is read-only visibility into deployed code-level handlers —
# both are ADMIN-only (enforced in app.api.deps via the AdminUser dependency).
app.include_router(attribute_definitions.router)
app.include_router(extensions.router)
