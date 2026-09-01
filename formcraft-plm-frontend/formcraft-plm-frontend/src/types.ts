// Shared TypeScript types mirroring the FormCraft PLM backend DTOs / entities.

export type UserRole = 'ADMIN' | 'PLM_MANAGER' | 'QUALITY_MANAGER' | 'PURCHASING' | 'VIEWER';

export interface CurrentUser {
  id?: number;
  username: string;
  fullName?: string;
  email?: string;
  role: UserRole;
}

export interface AppUser {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
}

export type ProductType = 'FINISHED_PRODUCT' | 'SEMI_FINISHED' | 'RAW_MATERIAL' | 'PACKAGING';
export type ProductState = 'DRAFT' | 'IN_VALIDATION' | 'VALIDATED' | 'ARCHIVED';

export interface NutrientValue {
  id: number;
  nutrientType: string;
  valuePer100g: number;
  unit: string;
}

export interface FormulationResult {
  id: number;
  chainId: string;
  status: string;
  computedValues?: Record<string, number>;
  nutriScore?: string;
  ecoScore?: string;
  totalCost?: number;
  errors?: string;
  warnings?: string;
  formulatedAt: string;
}

export interface QualityCheck {
  id: number;
  checkType: string;
  result: string;
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'WAIVED';
  checkedBy?: string;
  checkedAt: string;
}

export interface WorkflowTask {
  id: number;
  productId?: number;
  taskName: string;
  description?: string;
  assignee?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CompositionLine {
  id: number;
  ingredient: Product;
  quantity: number;
  percentage?: number;
  unit: string;
  isAllergen: boolean;
  position: number;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description?: string;
  productType: ProductType;
  state: ProductState;
  unit?: string;
  costPerKg?: number;
  formulaExpression?: string;
  allergenFlags?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  compositionLines?: CompositionLine[];
  nutrientValues?: NutrientValue[];
  formulationResults?: FormulationResult[];
  workflowTasks?: WorkflowTask[];
  qualityChecks?: QualityCheck[];
}

export interface AuditLog {
  id: number;
  entityId: number;
  entityType: string;
  action: string;
  performedBy?: string;
  details?: string;
  performedAt: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  rating?: number;
  active: boolean;
  createdAt: string;
}

export interface SupplierProduct {
  id: number;
  supplier?: Supplier;
  product?: Product;
  pricePerKg?: number;
  leadTimeDays?: number;
  moq?: number;
  preferred: boolean;
  createdAt: string;
}

export type SpecType = 'PHYSICAL' | 'CHEMICAL' | 'MICROBIOLOGICAL' | 'NUTRITIONAL' | 'PACKAGING';

export interface Specification {
  id: number;
  parameter: string;
  specType: SpecType;
  minValue?: number;
  maxValue?: number;
  targetValue?: number;
  unit?: string;
  createdAt: string;
  createdBy?: string;
}

export type NcSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type NcStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type CapaStatus = 'OPEN' | 'DONE';

export interface CorrectiveAction {
  id: number;
  description: string;
  owner?: string;
  dueDate?: string;
  status: CapaStatus;
  createdAt: string;
  closedAt?: string;
}

export interface NonConformance {
  id: number;
  product: Product;
  title: string;
  description?: string;
  severity: NcSeverity;
  status: NcStatus;
  raisedBy?: string;
  raisedAt: string;
  closedAt?: string;
  correctiveActions?: CorrectiveAction[];
}

export type ChangeRequestStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';

export interface ChangeRequest {
  id: number;
  product: Product;
  title: string;
  description?: string;
  reason?: string;
  impact?: string;
  status: ChangeRequestStatus;
  requestedBy?: string;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionComment?: string;
}

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';

export interface ProjectMilestone {
  id: number;
  name: string;
  gateNumber: number;
  status: MilestoneStatus;
  dueDate?: string;
  completedAt?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  owner?: string;
  targetLaunchDate?: string;
  createdAt: string;
  products?: Product[];
  milestones?: ProjectMilestone[];
}

export interface FCDocument {
  id: number;
  entityType: string;
  entityId: number;
  fileName: string;
  contentType?: string;
  fileSize?: number;
  version: number;
  uploadedBy?: string;
  uploadedAt: string;
}

export type StockMovementType = 'RECEIVE' | 'CONSUME' | 'ADJUST';

export interface StockLot {
  id: number;
  product: Product;
  lotNumber: string;
  quantityOnHand: number;
  unit?: string;
  expiryDate?: string;
  supplier?: Supplier;
  receivedAt: string;
  status: string;
}

export interface StockMovement {
  id: number;
  movementType: StockMovementType;
  quantity: number;
  performedBy?: string;
  performedAt: string;
  reference?: string;
}

export type NotificationCategory = 'TASK' | 'WORKFLOW' | 'QUALITY' | 'CHANGE_REQUEST' | 'INVENTORY' | 'SYSTEM';

export interface AppNotification {
  id: number;
  title: string;
  message?: string;
  link?: string;
  category: NotificationCategory;
  read: boolean;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
