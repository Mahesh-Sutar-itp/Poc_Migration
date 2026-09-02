import enum


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    PLM_MANAGER = "PLM_MANAGER"
    QUALITY_MANAGER = "QUALITY_MANAGER"
    PURCHASING = "PURCHASING"
    VIEWER = "VIEWER"
