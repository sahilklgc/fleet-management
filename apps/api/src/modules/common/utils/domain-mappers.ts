import {
  ServiceFrequency,
  StopCategory,
  StopStatus,
  type MasterStop,
  type RouteAssignment,
  type RouteDefinition
} from "@lgc/domain-types";
import type {
  Branch,
  Employee,
  MasterStop as PrismaMasterStop,
  Route,
  RouteAssignment as PrismaRouteAssignment,
  ServiceFrequency as PrismaServiceFrequency,
  StopCategory as PrismaStopCategory,
  StopStatus as PrismaStopStatus,
  Vehicle
} from "@prisma/client";

function mapStopCategory(category: PrismaStopCategory): StopCategory {
  switch (category) {
    case "PRESSURE_WASHING":
      return StopCategory.PressureWashing;
    case "SHELTER":
      return StopCategory.Shelter;
    case "STANDALONE":
      return StopCategory.Standalone;
  }
}

function mapServiceFrequency(serviceFrequency: PrismaServiceFrequency): ServiceFrequency {
  switch (serviceFrequency) {
    case "SEVEN_DAY":
      return ServiceFrequency.SevenDay;
    case "FIVE_DAY":
      return ServiceFrequency.FiveDay;
    case "BIWEEKLY":
      return ServiceFrequency.Biweekly;
  }
}

export function mapStopStatus(status: PrismaStopStatus): StopStatus {
  switch (status) {
    case "PENDING":
      return StopStatus.Pending;
    case "ARRIVED":
      return StopStatus.Arrived;
    case "COMPLETED":
      return StopStatus.Completed;
    case "SKIPPED":
      return StopStatus.Skipped;
    case "ISSUE_REPORTED":
      return StopStatus.IssueReported;
  }
}

export function mapBranch(branch: Branch) {
  return {
    id: branch.id,
    code: branch.code,
    name: branch.name,
    isActive: branch.isActive,
    createdAt: branch.createdAt.toISOString()
  };
}

export function mapEmployee(employee: Employee & { branch: Branch }) {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    fullName: `${employee.firstName} ${employee.lastName}`,
    phoneNumber: employee.phoneNumber,
    isActive: employee.isActive,
    branch: mapBranch(employee.branch),
    createdAt: employee.createdAt.toISOString()
  };
}

export function mapVehicle(vehicle: Vehicle & { branch: Branch }) {
  return {
    id: vehicle.id,
    vehicleNumber: vehicle.vehicleNumber,
    plateNumber: vehicle.plateNumber,
    vin: vehicle.vin,
    isActive: vehicle.isActive,
    branch: mapBranch(vehicle.branch),
    createdAt: vehicle.createdAt.toISOString()
  };
}

export function mapMasterStop(masterStop: PrismaMasterStop): MasterStop {
  return {
    id: masterStop.id,
    clientStopId: masterStop.clientStopId,
    name: masterStop.name,
    latitude: Number(masterStop.latitude),
    longitude: Number(masterStop.longitude),
    category: mapStopCategory(masterStop.category),
    serviceFrequency: mapServiceFrequency(masterStop.serviceFrequency),
    isActive: masterStop.isActive,
    manualOverride: masterStop.manualOverride,
    importedAt: masterStop.importedAt?.toISOString() ?? masterStop.createdAt.toISOString()
  };
}

export function mapRoute(route: Route & { branch: Branch; routeStops?: Array<{ id: string }> }): RouteDefinition & {
  branch: ReturnType<typeof mapBranch>;
  stopCount: number;
  createdAt: string;
} {
  return {
    id: route.id,
    branchId: route.branchId,
    code: route.code,
    name: route.name,
    isActive: route.isActive,
    branch: mapBranch(route.branch),
    stopCount: route.routeStops?.length ?? 0,
    createdAt: route.createdAt.toISOString()
  };
}

export function mapRouteAssignment(
  assignment: PrismaRouteAssignment & {
    route: Route;
    employee: Employee;
    vehicle: Vehicle;
  }
): RouteAssignment & {
  routeName: string;
  employeeName: string;
  vehicleNumber: string;
  startedAt: string | null;
  completedAt: string | null;
} {
  return {
    id: assignment.id,
    routeId: assignment.routeId,
    employeeId: assignment.employeeId,
    vehicleId: assignment.vehicleId,
    assignmentDate: assignment.assignmentDate.toISOString().slice(0, 10),
    routeName: assignment.route.name,
    employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
    vehicleNumber: assignment.vehicle.vehicleNumber,
    startedAt: assignment.startedAt?.toISOString() ?? null,
    completedAt: assignment.completedAt?.toISOString() ?? null
  };
}
