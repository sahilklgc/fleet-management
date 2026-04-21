import { Injectable } from "@nestjs/common";
import { StopCategory, type StopImportPreview } from "@lgc/domain-types";
import { PreviewStopImportDto } from "./dto/preview-stop-import.dto";

@Injectable()
export class ImportsService {
  preview(previewStopImportDto: PreviewStopImportDto): StopImportPreview {
    const counts: Record<StopCategory, number> = {
      [StopCategory.PressureWashing]: 0,
      [StopCategory.Shelter]: 0,
      [StopCategory.Standalone]: 0
    };
    const seen = new Set<string>();
    const duplicateClientStopIds = new Set<string>();
    let activeRows = 0;

    for (const row of previewStopImportDto.rows) {
      const normalizedStopId = row.clientStopId.trim().toUpperCase();

      if (seen.has(normalizedStopId)) {
        duplicateClientStopIds.add(normalizedStopId);
      } else {
        seen.add(normalizedStopId);
      }

      counts[row.category] += 1;

      if (row.isActive) {
        activeRows += 1;
      }
    }

    return {
      receivedRows: previewStopImportDto.rows.length,
      duplicateClientStopIds: Array.from(duplicateClientStopIds),
      activeRows,
      categoryBreakdown: counts
    };
  }
}
