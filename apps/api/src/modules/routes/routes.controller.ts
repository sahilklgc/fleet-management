import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
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

  @Get(":id")
  @RequirePermissions("routes.manage")
  getById(@Param("id") id: string) {
    return this.routesService.getById(id);
  }

  @Post()
  @RequirePermissions("routes.manage")
  @AuditAction("routes.create")
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }

  @Patch(":id")
  @RequirePermissions("routes.manage")
  @AuditAction("routes.update")
  update(@Param("id") id: string, @Body() updateRouteDto: CreateRouteDto) {
    return this.routesService.update(id, updateRouteDto);
  }

  @Delete(":id")
  @RequirePermissions("routes.manage")
  @AuditAction("routes.delete")
  remove(@Param("id") id: string) {
    return this.routesService.remove(id);
  }
}
