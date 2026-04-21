import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { resolve } from "node:path";
import { AssignmentsModule } from "./assignments/assignments.module";
import { AuditInterceptor } from "./audit/audit.interceptor";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "./auth/guards/permissions.guard";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { ImportsModule } from "./imports/imports.module";
import { WorkerModule } from "./worker/worker.module";

const rootEnvPath = resolve(__dirname, "../../../../.env");

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [rootEnvPath]
    }),
    DatabaseModule,
    AuditModule,
    AuthModule,
    AssignmentsModule,
    ImportsModule,
    WorkerModule,
    DashboardModule
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor
    }
  ]
})
export class AppModule {}
