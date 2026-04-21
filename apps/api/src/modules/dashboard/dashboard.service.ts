import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { getDayRange } from "../common/utils/date-range";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getManagerDashboard(date?: string) {
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
                id: true
              }
            }
          }
        },
        stopEvents: true
      }
    });

    const completedStops = assignments.reduce(
      (total, assignment) =>
        total + assignment.stopEvents.filter((event) => event.status === "COMPLETED").length,
      0
    );
    const issueReportedStops = assignments.reduce(
      (total, assignment) =>
        total + assignment.stopEvents.filter((event) => event.status === "ISSUE_REPORTED").length,
      0
    );
    const manualOverrides = assignments.reduce(
      (total, assignment) =>
        total + assignment.stopEvents.filter((event) => Boolean(event.reason)).length,
      0
    );
    const totalStops = assignments.reduce((total, assignment) => total + assignment.route.routeStops.length, 0);

    return {
      assignmentDate: dateKey,
      totalRoutes: assignments.length,
      assignedRoutes: assignments.length,
      unassignedRoutes: 0,
      pendingStops: Math.max(totalStops - completedStops, 0),
      completedStops,
      lateRoutes: assignments.filter((assignment) => !assignment.completedAt && assignment.startedAt).length,
      manualOverrides,
      issueReportedStops
    };
  }
}
