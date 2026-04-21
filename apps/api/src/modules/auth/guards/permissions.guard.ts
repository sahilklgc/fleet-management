import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ActiveUser, PermissionKey } from "@lgc/domain-types";
import { PERMISSIONS_KEY } from "../../common/decorators/permissions.decorator";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator";

@Injectable()
export class PermissionsGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: ActiveUser }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("Authentication is required.");
    }

    const missingPermissions = requiredPermissions.filter(
      (permission) => !user.permissions.includes(permission)
    );

    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Missing required permissions: ${missingPermissions.join(", ")}`
      );
    }

    return true;
  }
}
