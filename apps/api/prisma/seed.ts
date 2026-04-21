import bcrypt from "bcryptjs";
import { PrismaClient, UserStatus } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const permissions = [
  { key: "users.manage", name: "Manage users" },
  { key: "employees.manage", name: "Manage employees" },
  { key: "vehicles.manage", name: "Manage vehicles" },
  { key: "stops.manage", name: "Manage master stops" },
  { key: "routes.manage", name: "Manage routes" },
  { key: "assignments.manage", name: "Manage assignments" },
  { key: "stop-events.write", name: "Write stop events" },
  { key: "reports.export", name: "Export reports" },
  { key: "audit.read", name: "Read audit logs" }
] as const;

const roles = {
  super_admin: permissions.map((permission) => permission.key),
  admin: permissions.map((permission) => permission.key),
  manager: [
    "employees.manage",
    "vehicles.manage",
    "stops.manage",
    "routes.manage",
    "assignments.manage",
    "stop-events.write",
    "reports.export",
    "audit.read"
  ],
  on_site_manager: [
    "employees.manage",
    "vehicles.manage",
    "stops.manage",
    "routes.manage",
    "assignments.manage",
    "stop-events.write",
    "reports.export",
    "audit.read"
  ],
  worker: ["stop-events.write"]
} as const;

async function main() {
  const branch = await prisma.branch.upsert({
    where: { code: "HOU" },
    update: {},
    create: {
      code: "HOU",
      name: "Houston Operations"
    }
  });

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        name: permission.name
      },
      create: permission
    });
  }

  for (const [key, permissionKeys] of Object.entries(roles)) {
    const role = await prisma.role.upsert({
      where: { key },
      update: {
        name: key.replaceAll("_", " ")
      },
      create: {
        key,
        name: key.replaceAll("_", " ")
      }
    });

    for (const permissionKey of permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key: permissionKey }
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@lgc.local" },
    update: {
      passwordHash
    },
    create: {
      email: "admin@lgc.local",
      passwordHash,
      firstName: "System",
      lastName: "Admin",
      status: UserStatus.ACTIVE
    }
  });

  const role = await prisma.role.findUniqueOrThrow({
    where: { key: "super_admin" }
  });

  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id
    }
  });

  await prisma.employee.upsert({
    where: { employeeCode: "ADMIN-001" },
    update: {
      userId: user.id
    },
    create: {
      userId: user.id,
      branchId: branch.id,
      employeeCode: "ADMIN-001",
      firstName: "System",
      lastName: "Admin"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
