import { Controller, Get, Query } from "@nestjs/common";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { AuditAction } from "../common/decorators/audit-action.decorator";
import { AssignmentsService } from "./assignments.service";

@Controller("assignments")
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get("today")
  @RequirePermissions("assignments.manage")
  @AuditAction("assignments.view_daily_board")
  getToday(@Query("date") date?: string) {
    return this.assignmentsService.getDailyAssignments(date);
  }
}
