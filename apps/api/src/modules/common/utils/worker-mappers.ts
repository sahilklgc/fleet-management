import { StopCategory, StopStatus } from "@lgc/domain-types";
import type { StopCategory as PrismaStopCategory, StopStatus as PrismaStopStatus } from "@prisma/client";

export function mapStopCategory(category: PrismaStopCategory): StopCategory {
  switch (category) {
    case "PRESSURE_WASHING":
      return StopCategory.PressureWashing;
    case "SHELTER":
      return StopCategory.Shelter;
    case "STANDALONE":
      return StopCategory.Standalone;
  }
}

export function mapStopStatus(status: PrismaStopStatus): StopStatus {
  switch (status) {
    case "PENDING":
      return StopStatus.Pending;
    case "ARRIVED":
      return StopStatus.Arrived;
    case "COMPLETED":
      return StopStatus.Completed;
    case "SKIPPED":
      return StopStatus.Skipped;
    case "ISSUE_REPORTED":
      return StopStatus.IssueReported;
  }
}
