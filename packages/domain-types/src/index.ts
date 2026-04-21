export enum UserRole {
  SuperAdmin = "super_admin",
  Admin = "admin",
  Manager = "manager",
  OnSiteManager = "on_site_manager",
  Worker = "worker"
}

export enum StopStatus {
  Pending = "pending",
  Arrived = "arrived",
  Completed = "completed",
  Skipped = "skipped",
  IssueReported = "issue_reported"
}

export enum StopCategory {
  PressureWashing = "pressure_washing",
  Shelter = "shelter",
  Standalone = "standalone"
}

export enum ServiceFrequency {
  SevenDay = "7_day",
  FiveDay = "5_day",
  Biweekly = "biweekly"
}

export type PermissionKey =
  | "users.manage"
  | "employees.manage"
  | "vehicles.manage"
  | "stops.manage"
  | "routes.manage"
  | "assignments.manage"
  | "stop-events.write"
  | "reports.export"
  | "audit.read";

export interface MasterStop {
  id: string;
  clientStopId: string;
  name: string;
  latitude: number;
  longitude: number;
  category: StopCategory;
  serviceFrequency: ServiceFrequency;
  isActive: boolean;
  manualOverride: boolean;
  importedAt: string;
}

export interface RouteDefinition {
  id: string;
  code: string;
  name: string;
  branchId: string;
  isActive: boolean;
}

export interface RouteAssignment {
  id: string;
  routeId: string;
  employeeId: string;
  vehicleId: string;
  assignmentDate: string;
}

export interface ActiveUser {
  sub: string;
  email: string;
  roles: UserRole[];
  permissions: PermissionKey[];
  branchIds: string[];
}

export interface StopImportRowPreview {
  clientStopId: string;
  name: string;
  latitude: number;
  longitude: number;
  category: StopCategory;
  serviceFrequency: ServiceFrequency;
  isActive: boolean;
}

export interface StopImportPreview {
  receivedRows: number;
  duplicateClientStopIds: string[];
  activeRows: number;
  categoryBreakdown: Record<StopCategory, number>;
}

export interface WorkerRouteStopView {
  stopId: string;
  clientStopId: string;
  name: string;
  sequenceNumber: number;
  status: StopStatus;
  category: StopCategory;
}

export interface WorkerRouteView {
  assignmentId: string;
  routeCode: string;
  routeName: string;
  assignmentDate: string;
  workerName: string;
  vehicleNumber: string;
  stops: WorkerRouteStopView[];
}

export interface ManagerDashboardSummary {
  assignmentDate: string;
  totalRoutes: number;
  assignedRoutes: number;
  unassignedRoutes: number;
  pendingStops: number;
  completedStops: number;
  lateRoutes: number;
  manualOverrides: number;
  issueReportedStops: number;
}

export const DOMAIN_MODULES = [
  "auth",
  "users",
  "roles",
  "employees",
  "vehicles",
  "stops",
  "routes",
  "assignments",
  "stop-events",
  "imports",
  "exports",
  "audit-logs"
] as const;
