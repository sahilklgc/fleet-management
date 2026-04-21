import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { AuditAction } from "../common/decorators/audit-action.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { ActiveUser } from "@lgc/domain-types";
import { AssignmentsService } from "./assignments.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";

@Controller("assignments")
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get("today")
  @RequirePermissions("assignments.manage")
  @AuditAction("assignments.view_daily_board")
  getToday(@Query("date") date?: string) {
    return this.assignmentsService.getDailyAssignments(date);
  }

  @Post()
  @RequirePermissions("assignments.manage")
  @AuditAction("assignments.create")
  create(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @CurrentUser() user: ActiveUser | undefined
  ) {
    return this.assignmentsService.create(createAssignmentDto, user);
  }
}
