import { Injectable } from "@nestjs/common";
import type { ActiveUser } from "@lgc/domain-types";
import { starterWorkerRoute } from "../operations/starter-data";
import { CompleteStopDto } from "./dto/complete-stop.dto";

@Injectable()
export class WorkerService {
  getTodayRoute(user: ActiveUser | undefined) {
    return {
      ...starterWorkerRoute,
      workerEmail: user?.email ?? null
    };
  }

  completeStop(stopId: string, user: ActiveUser | undefined, completeStopDto: CompleteStopDto) {
    return {
      stopId,
      status: "completed",
      completedBy: user?.email ?? "unknown",
      completedAt: new Date().toISOString(),
      notes: completeStopDto.notes ?? null
    };
  }
}
