import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AuditAction } from "../common/decorators/audit-action.decorator";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { CreateRouteDto } from "./dto/create-route.dto";
import { RoutesService } from "./routes.service";

@Controller("routes")
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @RequirePermissions("routes.manage")
  list(@Query("branchId") branchId?: string) {
    return this.routesService.list(branchId);
  }

  @Post()
  @RequirePermissions("routes.manage")
  @AuditAction("routes.create")
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }
}
