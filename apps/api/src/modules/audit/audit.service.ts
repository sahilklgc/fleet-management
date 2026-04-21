import { Injectable, Logger } from "@nestjs/common";
import { AuditOutcome } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

interface RecordAuditParams {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  outcome?: AuditOutcome;
  metadataJson?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(params: RecordAuditParams) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: params.actorUserId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          outcome: params.outcome ?? AuditOutcome.SUCCESS,
          metadataJson: params.metadataJson
        }
      });
    } catch (error) {
      this.logger.warn(
        `Audit log write failed for action ${params.action}: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
    }
  }
}
