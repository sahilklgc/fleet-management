import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { mapRoute, mapRouteDetail } from "../common/utils/domain-mappers";
import { handlePrismaError } from "../common/utils/prisma-error";
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
    try {
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
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Route",
        duplicateMessage: "A route with this code already exists for the selected branch."
      });
    }
  }

  async getById(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        branch: true,
        routeStops: {
          include: {
            masterStop: true
          },
          orderBy: {
            sequenceNumber: "asc"
          }
        }
      }
    });

    if (!route) {
      throw new NotFoundException("Route not found.");
    }

    return mapRouteDetail(route);
  }

  async update(id: string, updateRouteDto: CreateRouteDto) {
    try {
      const route = await this.prisma.$transaction(async (tx) => {
        await tx.routeStop.deleteMany({
          where: {
            routeId: id
          }
        });

        return tx.route.update({
          where: { id },
          data: {
            branchId: updateRouteDto.branchId,
            code: updateRouteDto.code.trim().toUpperCase(),
            name: updateRouteDto.name.trim(),
            routeStops: updateRouteDto.stopIds?.length
              ? {
                  create: updateRouteDto.stopIds.map((masterStopId, index) => ({
                    masterStopId,
                    sequenceNumber: index + 1
                  }))
                }
              : undefined
          },
          include: {
            branch: true,
            routeStops: {
              include: {
                masterStop: true
              },
              orderBy: {
                sequenceNumber: "asc"
              }
            }
          }
        });
      });

      return mapRouteDetail(route);
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Route",
        duplicateMessage: "A route with this code already exists for the selected branch.",
        referenceMessage: "Route stops could not be updated because the route is still in use.",
        notFoundMessage: "Route not found."
      });
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.route.delete({
        where: { id }
      });

      return {
        deleted: true,
        id
      };
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Route",
        referenceMessage: "Route cannot be deleted while assignments still reference it.",
        notFoundMessage: "Route not found."
      });
    }
  }
}
