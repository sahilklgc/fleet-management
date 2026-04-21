import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { mapVehicle } from "../common/utils/domain-mappers";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(branchId?: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        branch: true
      },
      orderBy: {
        vehicleNumber: "asc"
      }
    });

    return vehicles.map(mapVehicle);
  }

  async create(createVehicleDto: CreateVehicleDto) {
    const vehicle = await this.prisma.vehicle.create({
      data: {
        branchId: createVehicleDto.branchId,
        vehicleNumber: createVehicleDto.vehicleNumber.trim(),
        plateNumber: createVehicleDto.plateNumber?.trim(),
        vin: createVehicleDto.vin?.trim()
      },
      include: {
        branch: true
      }
    });

    return mapVehicle(vehicle);
  }
}
