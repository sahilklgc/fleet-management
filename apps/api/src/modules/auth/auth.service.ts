import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";
import { UserRole, type ActiveUser, type PermissionKey } from "@lgc/domain-types";
import { PrismaService } from "../database/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email.toLowerCase()
      },
      include: {
        employee: true,
        roleAssignments: {
          include: {
            role: {
              include: {
                permissionAssignments: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const activeUser = this.buildActiveUser(user);
    const accessToken = await this.jwtService.signAsync(activeUser);

    return {
      accessToken,
      user: activeUser
    };
  }

  private buildActiveUser(user: {
    id: string;
    email: string;
    employee: { branchId: string } | null;
    roleAssignments: Array<{
      role: {
        key: string;
        permissionAssignments: Array<{
          permission: {
            key: string;
          };
        }>;
      };
    }>;
  }): ActiveUser {
    const roles = user.roleAssignments
      .map((assignment) => assignment.role.key)
      .filter((roleKey): roleKey is UserRole => Object.values(UserRole).includes(roleKey as UserRole));

    const permissions = Array.from(
      new Set(
        user.roleAssignments.flatMap((assignment) =>
          assignment.role.permissionAssignments.map(
            (permissionAssignment) => permissionAssignment.permission.key as PermissionKey
          )
        )
      )
    );

    return {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
      branchIds: user.employee ? [user.employee.branchId] : []
    };
  }
}
