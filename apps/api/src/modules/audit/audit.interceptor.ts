import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { catchError, tap } from "rxjs/operators";
import type { Observable } from "rxjs";
import type { ActiveUser } from "@lgc/domain-types";
import { AuditOutcome } from "@prisma/client";
import { AUDIT_ACTION_KEY } from "../common/decorators/audit-action.decorator";
import { AuditService } from "./audit.service";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.getAllAndOverride<string>(AUDIT_ACTION_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      params?: Record<string, string>;
      query?: Record<string, string | string[]>;
      body?: Record<string, unknown>;
      user?: ActiveUser;
    }>();

    return next.handle().pipe(
      tap(() => {
        void this.auditService.record({
          actorUserId: request.user?.sub,
          action,
          entityType: "api_request",
          entityId: request.params?.id,
          metadataJson: {
            method: request.method,
            url: request.url,
            query: request.query,
            body: this.redactSensitiveFields(request.body)
          }
        });
      }),
      catchError((error: unknown) => {
        void this.auditService.record({
          actorUserId: request.user?.sub,
          action,
          entityType: "api_request",
          entityId: request.params?.id,
          outcome: AuditOutcome.FAILURE,
          metadataJson: {
            method: request.method,
            url: request.url,
            query: request.query,
            body: this.redactSensitiveFields(request.body),
            error: error instanceof Error ? error.message : "unknown error"
          }
        });

        throw error;
      })
    );
  }

  private redactSensitiveFields(body: Record<string, unknown> | undefined) {
    if (!body) {
      return undefined;
    }

    const clone = { ...body };
    if ("password" in clone) {
      clone.password = "[REDACTED]";
    }

    return clone;
  }
}
