import { Injectable } from "@nestjs/common";
import { starterManagerDashboard } from "../operations/starter-data";

@Injectable()
export class DashboardService {
  getManagerDashboard(date?: string) {
    return {
      ...starterManagerDashboard,
      assignmentDate: date ?? starterManagerDashboard.assignmentDate
    };
  }
}
