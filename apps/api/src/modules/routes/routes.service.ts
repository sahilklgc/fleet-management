import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { mapRoute } from "../common/utils/domain-mappers";
import { CreateRouteDto } from "./dto/create-route.dto";

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(branchId?: string) {
    const routes = await this.prisma.route.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        branch: true,
        routeStops: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        code: "asc"
      }
    });

    return routes.map(mapRoute);
  }

  async create(createRouteDto: CreateRouteDto) {
    const route = await this.prisma.route.create({
      data: {
        branchId: createRouteDto.branchId,
        code: createRouteDto.code.trim().toUpperCase(),
        name: createRouteDto.name.trim(),
        routeStops: createRouteDto.stopIds?.length
          ? {
              create: createRouteDto.stopIds.map((masterStopId, index) => ({
                masterStopId,
                sequenceNumber: index + 1
              }))
            }
          : undefined
      },
      include: {
        branch: true,
        routeStops: {
          select: {
            id: true
          }
        }
      }
    });

    return mapRoute(route);
  }
}
