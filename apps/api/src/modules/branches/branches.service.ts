import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { mapBranch } from "../common/utils/domain-mappers";
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
    const branch = await this.prisma.branch.create({
      data: {
        code: createBranchDto.code.trim().toUpperCase(),
        name: createBranchDto.name.trim()
      }
    });

    return mapBranch(branch);
  }
}
