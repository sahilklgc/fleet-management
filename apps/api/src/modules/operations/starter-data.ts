import {
  ServiceFrequency,
  StopCategory,
  StopStatus,
  type ManagerDashboardSummary,
  type WorkerRouteView
} from "@lgc/domain-types";

export const starterImportRows = [
  {
    clientStopId: "METRO-1001",
    name: "Main St & Polk",
    latitude: 29.7604,
    longitude: -95.3698,
    category: StopCategory.Shelter,
    serviceFrequency: ServiceFrequency.SevenDay,
    isActive: true
  },
  {
    clientStopId: "METRO-1002",
    name: "Dallas St & Smith",
    latitude: 29.7578,
    longitude: -95.3671,
    category: StopCategory.Standalone,
    serviceFrequency: ServiceFrequency.FiveDay,
    isActive: true
  }
] as const;

export const starterWorkerRoute: WorkerRouteView = {
  assignmentId: "assignment-demo-001",
  routeCode: "R-12",
  routeName: "Downtown Core",
  assignmentDate: new Date().toISOString().slice(0, 10),
  workerName: "Alex Johnson",
  vehicleNumber: "Truck-17",
  stops: [
    {
      stopId: "stop-001",
      clientStopId: "METRO-1001",
      name: "Main St & Polk",
      sequenceNumber: 1,
      status: StopStatus.Pending,
      category: StopCategory.Shelter
    },
    {
      stopId: "stop-002",
      clientStopId: "METRO-1002",
      name: "Dallas St & Smith",
      sequenceNumber: 2,
      status: StopStatus.Arrived,
      category: StopCategory.Standalone
    },
    {
      stopId: "stop-003",
      clientStopId: "METRO-1003",
      name: "Lamar St & Walker",
      sequenceNumber: 3,
      status: StopStatus.Completed,
      category: StopCategory.PressureWashing
    }
  ]
};

export const starterManagerDashboard: ManagerDashboardSummary = {
  assignmentDate: new Date().toISOString().slice(0, 10),
  totalRoutes: 12,
  assignedRoutes: 10,
  unassignedRoutes: 2,
  pendingStops: 84,
  completedStops: 41,
  lateRoutes: 1,
  manualOverrides: 3,
  issueReportedStops: 2
};
