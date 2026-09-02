import enum


class StockMovementType(str, enum.Enum):
    RECEIVE = "RECEIVE"
    CONSUME = "CONSUME"
    ADJUST = "ADJUST"
