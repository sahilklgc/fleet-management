import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AuditAction } from "../common/decorators/audit-action.decorator";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { VehiclesService } from "./vehicles.service";

@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @RequirePermissions("vehicles.manage")
  list(@Query("branchId") branchId?: string) {
    return this.vehiclesService.list(branchId);
  }

  @Post()
  @RequirePermissions("vehicles.manage")
  @AuditAction("vehicles.create")
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }
}
