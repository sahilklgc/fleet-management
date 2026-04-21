import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { mapEmployee } from "../common/utils/domain-mappers";
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
  }
}
