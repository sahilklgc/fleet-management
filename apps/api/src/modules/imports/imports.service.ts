import {
  ConflictException,
  Injectable
} from "@nestjs/common";
import type { ActiveUser } from "@lgc/domain-types";
import { StopCategory, type StopImportPreview } from "@lgc/domain-types";
import { PrismaService } from "../database/prisma.service";
import { PreviewStopImportDto } from "./dto/preview-stop-import.dto";
import { PreviewRouteSplitImportDto } from "./dto/route-split-import.dto";

interface NormalizedRouteSplitRow {
  bsid: string;
  stopName: string | null;
  sourceRouteNumber: string | null;
  sourceRouteName: string | null;
}

interface NormalizedRouteSplit {
  routeName: string;
  routeCode: string;
  rows: NormalizedRouteSplitRow[];
}

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async previewRouteSplit(previewRouteSplitImportDto: PreviewRouteSplitImportDto) {
    const normalizedRoutes = this.normalizeRouteSplitImport(previewRouteSplitImportDto);
    const duplicateBsids = this.findDuplicateBsids(normalizedRoutes);
    const uniqueBsids = Array.from(
      new Set(normalizedRoutes.flatMap((route) => route.rows.map((row) => row.bsid)))
    );

    const [matchedStops, existingRoutes] = await Promise.all([
      this.prisma.masterStop.findMany({
        where: {
          clientStopId: {
            in: uniqueBsids
          }
        },
        select: {
          id: true,
          clientStopId: true
        }
      }),
      this.prisma.route.findMany({
        where: {
          branchId: previewRouteSplitImportDto.branchId,
          code: {
            in: normalizedRoutes.map((route) => route.routeCode)
          }
        },
        select: {
          id: true,
          code: true,
          name: true
        }
      })
    ]);

    const matchedStopIds = new Set(matchedStops.map((stop) => stop.clientStopId));
    const existingRouteCodes = new Set(existingRoutes.map((route) => route.code));
    const unmatchedBsids = uniqueBsids.filter((bsid) => !matchedStopIds.has(bsid));

    return {
      workbookName: previewRouteSplitImportDto.workbookName?.trim() || "Route split workbook",
      branchId: previewRouteSplitImportDto.branchId,
      receivedRoutes: normalizedRoutes.length,
      receivedRows: normalizedRoutes.reduce((total, route) => total + route.rows.length, 0),
      matchedStops: matchedStops.length,
      unmatchedBsids,
      duplicateBsids,
      routeSummaries: normalizedRoutes.map((route) => ({
        routeName: route.routeName,
        routeCode: route.routeCode,
        rowCount: route.rows.length,
        matchedRowCount: route.rows.filter((row) => matchedStopIds.has(row.bsid)).length,
        unmatchedBsids: route.rows
          .map((row) => row.bsid)
          .filter((bsid) => !matchedStopIds.has(bsid)),
        existingRoute: existingRouteCodes.has(route.routeCode)
      }))
    };
  }

  async applyRouteSplit(previewRouteSplitImportDto: PreviewRouteSplitImportDto, user: ActiveUser) {
    const preview = await this.previewRouteSplit(previewRouteSplitImportDto);

    if (preview.duplicateBsids.length > 0 || preview.unmatchedBsids.length > 0) {
      throw new ConflictException(
        "Resolve duplicate or unmatched BSIDs before applying the route split import."
      );
    }

    const normalizedRoutes = this.normalizeRouteSplitImport(previewRouteSplitImportDto);
    const masterStops = await this.prisma.masterStop.findMany({
      where: {
        clientStopId: {
          in: Array.from(
            new Set(normalizedRoutes.flatMap((route) => route.rows.map((row) => row.bsid)))
          )
        }
      },
      select: {
        id: true,
        clientStopId: true
      }
    });

    const stopIdByBsid = new Map(masterStops.map((stop) => [stop.clientStopId, stop.id]));

    return this.prisma.$transaction(async (tx) => {
      const importBatch = await tx.importBatch.create({
        data: {
          importedByUserId: user.sub,
          fileName: preview.workbookName,
          source: "manager_route_split_workbook",
          appliedAt: new Date(),
          rows: {
            create: normalizedRoutes.flatMap((route) =>
              route.rows.map((row, index) => ({
                rowNumber: index + 1,
                clientStopId: row.bsid,
                rowPayload: {
                  routeName: route.routeName,
                  routeCode: route.routeCode,
                  stopName: row.stopName,
                  sourceRouteNumber: row.sourceRouteNumber,
                  sourceRouteName: row.sourceRouteName
                }
              }))
            )
          }
        }
      });

      for (const route of normalizedRoutes) {
        const existingRoute = await tx.route.findFirst({
          where: {
            branchId: previewRouteSplitImportDto.branchId,
            code: route.routeCode
          },
          select: {
            id: true
          }
        });

        const savedRoute = existingRoute
          ? await tx.route.update({
              where: {
                id: existingRoute.id
              },
              data: {
                name: route.routeName
              }
            })
          : await tx.route.create({
              data: {
                branchId: previewRouteSplitImportDto.branchId,
                code: route.routeCode,
                name: route.routeName
              }
            });

        await tx.routeStop.deleteMany({
          where: {
            routeId: savedRoute.id
          }
        });

        await tx.routeStop.createMany({
          data: route.rows.map((row, index) => ({
            routeId: savedRoute.id,
            masterStopId: stopIdByBsid.get(row.bsid) ?? "",
            sequenceNumber: index + 1
          }))
        });
      }

      return {
        importBatchId: importBatch.id,
        appliedRoutes: normalizedRoutes.length,
        appliedStops: preview.receivedRows,
        updatedRoutes: preview.routeSummaries.filter((route) => route.existingRoute).length,
        createdRoutes: preview.routeSummaries.filter((route) => !route.existingRoute).length
      };
    });
  }

  private normalizeRouteSplitImport(previewRouteSplitImportDto: PreviewRouteSplitImportDto): NormalizedRouteSplit[] {
    return previewRouteSplitImportDto.routes.map((route) => {
      const normalizedRouteName = route.routeName.trim().replace(/\s+/g, " ");

      return {
        routeName: normalizedRouteName,
        routeCode: this.toRouteCode(normalizedRouteName),
        rows: route.rows.map((row) => ({
          bsid: row.bsid.trim(),
          stopName: row.stopName?.trim() || null,
          sourceRouteNumber: row.sourceRouteNumber?.trim() || null,
          sourceRouteName: row.sourceRouteName?.trim().toUpperCase() || null
        }))
      };
    });
  }

  private findDuplicateBsids(routes: NormalizedRouteSplit[]) {
    const seen = new Set<string>();
    const duplicateBsids = new Set<string>();

    for (const route of routes) {
      for (const row of route.rows) {
        if (seen.has(row.bsid)) {
          duplicateBsids.add(row.bsid);
        } else {
          seen.add(row.bsid);
        }
      }
    }

    return Array.from(duplicateBsids).sort();
  }

  private toRouteCode(routeName: string) {
    return routeName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 20);
  }
}
