import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { mapBranch } from "../common/utils/domain-mappers";
import { handlePrismaError } from "../common/utils/prisma-error";
import { CreateBranchDto } from "./dto/create-branch.dto";

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const branches = await this.prisma.branch.findMany({
      orderBy: {
        name: "asc"
      }
    });

    return branches.map(mapBranch);
  }

  async create(createBranchDto: CreateBranchDto) {
    try {
      const branch = await this.prisma.branch.create({
        data: {
          code: createBranchDto.code.trim().toUpperCase(),
          name: createBranchDto.name.trim()
        }
      });

      return mapBranch(branch);
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Branch",
        duplicateMessage: "A branch with this code already exists."
      });
    }
  }

  async update(id: string, updateBranchDto: CreateBranchDto) {
    try {
      const branch = await this.prisma.branch.update({
        where: { id },
        data: {
          code: updateBranchDto.code.trim().toUpperCase(),
          name: updateBranchDto.name.trim()
        }
      });

      return mapBranch(branch);
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Branch",
        duplicateMessage: "A branch with this code already exists.",
        notFoundMessage: "Branch not found."
      });
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.branch.delete({
        where: { id }
      });

      return {
        deleted: true,
        id
      };
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Branch",
        referenceMessage:
          "Branch cannot be deleted while employees, vehicles, or routes still belong to it.",
        notFoundMessage: "Branch not found."
      });
    }
  }
}
