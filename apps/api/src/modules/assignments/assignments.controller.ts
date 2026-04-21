import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
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

  @Patch(":id")
  @RequirePermissions("assignments.manage")
  @AuditAction("assignments.update")
  update(
    @Param("id") id: string,
    @Body() updateAssignmentDto: CreateAssignmentDto,
    @CurrentUser() user: ActiveUser | undefined
  ) {
    return this.assignmentsService.update(id, updateAssignmentDto, user);
  }

  @Delete(":id")
  @RequirePermissions("assignments.manage")
  @AuditAction("assignments.delete")
  remove(@Param("id") id: string) {
    return this.assignmentsService.remove(id);
  }
}
