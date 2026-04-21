import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AuditAction } from "../common/decorators/audit-action.decorator";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { EmployeesService } from "./employees.service";

@Controller("employees")
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions("employees.manage")
  list(@Query("branchId") branchId?: string) {
    return this.employeesService.list(branchId);
  }

  @Post()
  @RequirePermissions("employees.manage")
  @AuditAction("employees.create")
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Patch(":id")
  @RequirePermissions("employees.manage")
  @AuditAction("employees.update")
  update(@Param("id") id: string, @Body() updateEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(":id")
  @RequirePermissions("employees.manage")
  @AuditAction("employees.delete")
  remove(@Param("id") id: string) {
    return this.employeesService.remove(id);
  }
}
