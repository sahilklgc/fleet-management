import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { AuditAction } from "../common/decorators/audit-action.decorator";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { BranchesService } from "./branches.service";

@Controller("branches")
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @RequirePermissions("users.manage")
  list() {
    return this.branchesService.list();
  }

  @Post()
  @RequirePermissions("users.manage")
  @AuditAction("branches.create")
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Patch(":id")
  @RequirePermissions("users.manage")
  @AuditAction("branches.update")
  update(@Param("id") id: string, @Body() updateBranchDto: CreateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(":id")
  @RequirePermissions("users.manage")
  @AuditAction("branches.delete")
  remove(@Param("id") id: string) {
    return this.branchesService.remove(id);
  }
}
