import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AuditAction } from "../common/decorators/audit-action.decorator";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { CreateStopDto } from "./dto/create-stop.dto";
import { StopsService } from "./stops.service";

@Controller("stops")
export class StopsController {
  constructor(private readonly stopsService: StopsService) {}

  @Get()
  @RequirePermissions("stops.manage")
  list(@Query("category") category?: string) {
    return this.stopsService.list(category);
  }

  @Post()
  @RequirePermissions("stops.manage")
  @AuditAction("stops.create")
  create(@Body() createStopDto: CreateStopDto) {
    return this.stopsService.create(createStopDto);
  }

  @Patch(":id")
  @RequirePermissions("stops.manage")
  @AuditAction("stops.update")
  update(@Param("id") id: string, @Body() updateStopDto: CreateStopDto) {
    return this.stopsService.update(id, updateStopDto);
  }

  @Delete(":id")
  @RequirePermissions("stops.manage")
  @AuditAction("stops.delete")
  remove(@Param("id") id: string) {
    return this.stopsService.remove(id);
  }
}
