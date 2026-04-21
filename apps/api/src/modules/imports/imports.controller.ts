import { Body, Controller, Post } from "@nestjs/common";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { AuditAction } from "../common/decorators/audit-action.decorator";
import { PreviewStopImportDto } from "./dto/preview-stop-import.dto";
import { ImportsService } from "./imports.service";

@Controller("imports/stops")
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post("preview")
  @RequirePermissions("stops.manage")
  @AuditAction("stops.preview_import")
  preview(@Body() previewStopImportDto: PreviewStopImportDto) {
    return this.importsService.preview(previewStopImportDto);
  }
}
