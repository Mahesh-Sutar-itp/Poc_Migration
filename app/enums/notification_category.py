import enum


class NotificationCategory(str, enum.Enum):
    TASK = "TASK"
    WORKFLOW = "WORKFLOW"
    QUALITY = "QUALITY"
    CHANGE_REQUEST = "CHANGE_REQUEST"
    INVENTORY = "INVENTORY"
    SYSTEM = "SYSTEM"
