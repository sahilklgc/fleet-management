import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { AuditAction } from "../common/decorators/audit-action.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { ActiveUser } from "@lgc/domain-types";
import { CompleteStopDto } from "./dto/complete-stop.dto";
import { WorkerService } from "./worker.service";

@Controller("worker")
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Get("today-route")
  @RequirePermissions("stop-events.write")
  @AuditAction("worker.view_today_route")
  getTodayRoute(@CurrentUser() user: ActiveUser | undefined) {
    return this.workerService.getTodayRoute(user);
  }

  @Post("stops/:stopId/complete")
  @RequirePermissions("stop-events.write")
  @AuditAction("worker.complete_stop")
  completeStop(
    @Param("stopId") stopId: string,
    @CurrentUser() user: ActiveUser | undefined,
    @Body() completeStopDto: CompleteStopDto
  ) {
    return this.workerService.completeStop(stopId, user, completeStopDto);
  }
}
