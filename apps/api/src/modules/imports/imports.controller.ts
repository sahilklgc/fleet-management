import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common";
import type { ActiveUser } from "@lgc/domain-types";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { AuditAction } from "../common/decorators/audit-action.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PreviewStopImportDto } from "./dto/preview-stop-import.dto";
import { PreviewRouteSplitImportDto } from "./dto/route-split-import.dto";
import { ImportsService } from "./imports.service";

@Controller("imports")
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post("stops/preview")
  @RequirePermissions("stops.manage")
  @AuditAction("stops.preview_import")
  preview(@Body() previewStopImportDto: PreviewStopImportDto) {
    return this.importsService.preview(previewStopImportDto);
  }

  @Post("routes/preview")
  @RequirePermissions("routes.manage")
  @AuditAction("routes.preview_split_import")
  previewRouteSplit(@Body() previewRouteSplitImportDto: PreviewRouteSplitImportDto) {
    return this.importsService.previewRouteSplit(previewRouteSplitImportDto);
  }

  @Post("routes/apply")
  @RequirePermissions("routes.manage")
  @AuditAction("routes.apply_split_import")
  applyRouteSplit(
    @Body() previewRouteSplitImportDto: PreviewRouteSplitImportDto,
    @CurrentUser() user: ActiveUser | undefined
  ) {
    if (!user) {
      throw new UnauthorizedException("Active user is required for imports.");
    }

    return this.importsService.applyRouteSplit(previewRouteSplitImportDto, user);
  }
}
