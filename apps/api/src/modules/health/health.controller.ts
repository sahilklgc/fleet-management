import { Controller, Get } from "@nestjs/common";
import { DOMAIN_MODULES, UserRole } from "@lgc/domain-types";
import { PublicRoute } from "../common/decorators/public.decorator";

@Controller("health")
export class HealthController {
  @Get()
  @PublicRoute()
  getHealth() {
    return {
      status: "ok",
      service: "api",
      modules: DOMAIN_MODULES,
      starterRole: UserRole.SuperAdmin
    };
  }
}
