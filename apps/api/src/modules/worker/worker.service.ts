import { Injectable } from "@nestjs/common";
import { StopStatus, type ActiveUser } from "@lgc/domain-types";
import { PrismaService } from "../database/prisma.service";
import { getDayRange } from "../common/utils/date-range";
import { mapStopCategory, mapStopStatus } from "../common/utils/worker-mappers";
import { CompleteStopDto } from "./dto/complete-stop.dto";

@Injectable()
export class WorkerService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayRoute(user: ActiveUser | undefined) {
    if (!user) {
      return null;
    }

    const { start, end, dateKey } = getDayRange();
    const assignment = await this.prisma.routeAssignment.findFirst({
      where: {
        assignmentDate: {
          gte: start,
          lt: end
        },
        employee: {
          userId: user.sub
        }
      },
      include: {
        route: {
          include: {
            routeStops: {
              include: {
                masterStop: true
              },
              orderBy: {
                sequenceNumber: "asc"
              }
            }
          }
        },
        vehicle: true,
        employee: true,
        stopEvents: {
          orderBy: {
            occurredAt: "desc"
          }
        }
      }
    });

    if (!assignment) {
      return null;
    }

    const latestStatusByStopId = new Map<string, StopStatus>();
    for (const event of assignment.stopEvents) {
      if (!latestStatusByStopId.has(event.masterStopId)) {
        latestStatusByStopId.set(event.masterStopId, mapStopStatus(event.status));
      }
    }

    return {
      assignmentId: assignment.id,
      routeCode: assignment.route.code,
      routeName: assignment.route.name,
      assignmentDate: dateKey,
      workerName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
      vehicleNumber: assignment.vehicle.vehicleNumber,
      workerEmail: user.email,
      stops: assignment.route.routeStops.map((routeStop) => ({
        stopId: routeStop.masterStop.id,
        clientStopId: routeStop.masterStop.clientStopId,
        name: routeStop.masterStop.name,
        sequenceNumber: routeStop.sequenceNumber,
        status: latestStatusByStopId.get(routeStop.masterStopId) ?? StopStatus.Pending,
        category: mapStopCategory(routeStop.masterStop.category)
      }))
    };
  }

  async completeStop(stopId: string, user: ActiveUser | undefined, completeStopDto: CompleteStopDto) {
    if (!user) {
      return null;
    }

    const { start, end } = getDayRange();
    const assignment = await this.prisma.routeAssignment.findFirst({
      where: {
        assignmentDate: {
          gte: start,
          lt: end
        },
        employee: {
          userId: user.sub
        },
        route: {
          routeStops: {
            some: {
              masterStopId: stopId
            }
          }
        }
      }
    });

    if (!assignment) {
      return null;
    }

    await this.prisma.stopEvent.create({
      data: {
        routeAssignmentId: assignment.id,
        masterStopId: stopId,
        status: "COMPLETED",
        occurredAt: new Date(),
        reason: completeStopDto.notes,
        createdByUserId: user.sub
      }
    });

    return {
      stopId,
      status: "completed",
      completedBy: user.email,
      completedAt: new Date().toISOString(),
      notes: completeStopDto.notes ?? null
    };
  }
}
