import enum


class QualityCheckStatus(str, enum.Enum):
    PENDING = "PENDING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    WAIVED = "WAIVED"
