import { Controller, Get, Query } from "@nestjs/common";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { AuditAction } from "../common/decorators/audit-action.decorator";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("manager/today")
  @RequirePermissions("routes.manage")
  @AuditAction("dashboard.view_manager_today")
  getManagerToday(@Query("date") date?: string) {
    return this.dashboardService.getManagerDashboard(date);
  }
}
