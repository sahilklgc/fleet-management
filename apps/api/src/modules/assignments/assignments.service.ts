import { Injectable } from "@nestjs/common";
import type { ActiveUser } from "@lgc/domain-types";
import { PrismaService } from "../database/prisma.service";
import { getDayRange } from "../common/utils/date-range";
import { mapRouteAssignment, mapStopStatus } from "../common/utils/domain-mappers";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyAssignments(date?: string) {
    const { dateKey, start, end } = getDayRange(date);
    const assignments = await this.prisma.routeAssignment.findMany({
      where: {
        assignmentDate: {
          gte: start,
          lt: end
        }
      },
      include: {
        route: {
          include: {
            routeStops: {
              select: {
                id: true,
                masterStopId: true
              }
            }
          }
        },
        employee: true,
        vehicle: true,
        stopEvents: {
          orderBy: {
            occurredAt: "desc"
          }
        }
      },
      orderBy: {
        route: {
          code: "asc"
        }
      }
    });

    return {
      assignmentDate: dateKey,
      routes: assignments.map((assignment) => {
        const completedStopIds = new Set(
          assignment.stopEvents
            .filter((event) => event.status === "COMPLETED")
            .map((event) => event.masterStopId)
        );

        const issueStopIds = new Set(
          assignment.stopEvents
            .filter((event) => event.status === "ISSUE_REPORTED")
            .map((event) => event.masterStopId)
        );

        return {
          ...mapRouteAssignment(assignment),
          routeCode: assignment.route.code,
          routeName: assignment.route.name,
          employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
          vehicleNumber: assignment.vehicle.vehicleNumber,
          pendingStops: Math.max(assignment.route.routeStops.length - completedStopIds.size, 0),
          completedStops: completedStopIds.size,
          issueReportedStops: issueStopIds.size,
          status: assignment.completedAt
            ? "completed"
            : assignment.startedAt
              ? "in_progress"
              : "assigned"
        };
      })
    };
  }

  async create(createAssignmentDto: CreateAssignmentDto, user: ActiveUser | undefined) {
    const assignment = await this.prisma.routeAssignment.create({
      data: {
        routeId: createAssignmentDto.routeId,
        employeeId: createAssignmentDto.employeeId,
        vehicleId: createAssignmentDto.vehicleId,
        assignedByUserId: user?.sub ?? "",
        assignmentDate: new Date(createAssignmentDto.assignmentDate)
      },
      include: {
        route: true,
        employee: true,
        vehicle: true
      }
    });

    return mapRouteAssignment(assignment);
  }
}
