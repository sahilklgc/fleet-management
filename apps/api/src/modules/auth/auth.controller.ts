import { Body, Controller, Get, Post } from "@nestjs/common";
import { PublicRoute } from "../common/decorators/public.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { ActiveUser } from "@lgc/domain-types";
import { LoginDto } from "./dto/login.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @PublicRoute()
  @Post("login")
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get("me")
  me(@CurrentUser() user: ActiveUser | undefined) {
    return user;
  }
}
