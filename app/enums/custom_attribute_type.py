import enum


class CustomAttributeType(str, enum.Enum):
    """Data type of a client-defined custom attribute (Customization Gate 2)."""
    STRING = "STRING"
    NUMBER = "NUMBER"
    BOOLEAN = "BOOLEAN"
    DATE = "DATE"
