import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { mapEmployee } from "../common/utils/domain-mappers";
import { handlePrismaError } from "../common/utils/prisma-error";
import { CreateEmployeeDto } from "./dto/create-employee.dto";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(branchId?: string) {
    const employees = await this.prisma.employee.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        branch: true
      },
      orderBy: [
        {
          firstName: "asc"
        },
        {
          lastName: "asc"
        }
      ]
    });

    return employees.map(mapEmployee);
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    try {
      const employee = await this.prisma.employee.create({
        data: {
          branchId: createEmployeeDto.branchId,
          employeeCode: createEmployeeDto.employeeCode.trim().toUpperCase(),
          firstName: createEmployeeDto.firstName.trim(),
          lastName: createEmployeeDto.lastName.trim(),
          phoneNumber: createEmployeeDto.phoneNumber?.trim()
        },
        include: {
          branch: true
        }
      });

      return mapEmployee(employee);
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Employee",
        duplicateMessage: "An employee with this code already exists."
      });
    }
  }

  async update(id: string, updateEmployeeDto: CreateEmployeeDto) {
    try {
      const employee = await this.prisma.employee.update({
        where: { id },
        data: {
          branchId: updateEmployeeDto.branchId,
          employeeCode: updateEmployeeDto.employeeCode.trim().toUpperCase(),
          firstName: updateEmployeeDto.firstName.trim(),
          lastName: updateEmployeeDto.lastName.trim(),
          phoneNumber: updateEmployeeDto.phoneNumber?.trim()
        },
        include: {
          branch: true
        }
      });

      return mapEmployee(employee);
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Employee",
        duplicateMessage: "An employee with this code already exists.",
        notFoundMessage: "Employee not found."
      });
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.employee.delete({
        where: { id }
      });

      return {
        deleted: true,
        id
      };
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Employee",
        referenceMessage: "Employee cannot be deleted while assignments still reference them.",
        notFoundMessage: "Employee not found."
      });
    }
  }
}
