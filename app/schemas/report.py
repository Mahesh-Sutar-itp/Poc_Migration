from pydantic import BaseModel


# DERIVED-FROM-SERVICE: DashboardSummary — shape derived from ReportServiceImpl.getDashboardSummary()
class DashboardSummary(BaseModel):
    totalProducts: int
    draftCount: int
    validatedCount: int
    inValidationCount: int
    archivedCount: int
    openNonConformances: int
    inProgressNonConformances: int
    pendingTasks: int


# DERIVED-FROM-SERVICE: CostBreakdownItem — shape derived from ReportServiceImpl.getCostBreakdown()
class CostBreakdownItem(BaseModel):
    ingredientCode: str
    ingredientName: str
    percentage: float
    costPerKg: float
    lineCost: float


# DERIVED-FROM-SERVICE: AllergenMatrixRow — shape derived from ReportServiceImpl.getAllergenMatrix()
class AllergenMatrixRow(BaseModel):
    productId: int
    productCode: str
    productName: str
    allergens: list[str]


# DERIVED-FROM-SERVICE: QualityPassRate — shape derived from ReportServiceImpl.getQualityPassRate()
class QualityPassRate(BaseModel):
    passed: int
    failed: int
    total: int
    rate: float


# DERIVED-FROM-SERVICE: ActivityEntry — shape derived from ReportServiceImpl.getRecentActivity()
class ActivityEntry(BaseModel):
    id: int
    entityId: int
    entityType: str
    action: str
    performedBy: str | None = None
    details: str | None = None
    performedAt: str
