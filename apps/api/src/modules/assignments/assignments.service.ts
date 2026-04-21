import { Injectable } from "@nestjs/common";

@Injectable()
export class AssignmentsService {
  getDailyAssignments(date?: string) {
    return {
      assignmentDate: date ?? new Date().toISOString().slice(0, 10),
      routes: [
        {
          routeCode: "R-12",
          routeName: "Downtown Core",
          employeeName: "Alex Johnson",
          vehicleNumber: "Truck-17",
          pendingStops: 8,
          completedStops: 4,
          status: "in_progress"
        },
        {
          routeCode: "R-18",
          routeName: "East Loop",
          employeeName: null,
          vehicleNumber: null,
          pendingStops: 11,
          completedStops: 0,
          status: "unassigned"
        }
      ]
    };
  }
}
