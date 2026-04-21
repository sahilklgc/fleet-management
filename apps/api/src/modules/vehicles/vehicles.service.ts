import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { mapVehicle } from "../common/utils/domain-mappers";
import { handlePrismaError } from "../common/utils/prisma-error";
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
    try {
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
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Vehicle",
        duplicateMessage: "A vehicle with this number already exists."
      });
    }
  }

  async update(id: string, updateVehicleDto: CreateVehicleDto) {
    try {
      const vehicle = await this.prisma.vehicle.update({
        where: { id },
        data: {
          branchId: updateVehicleDto.branchId,
          vehicleNumber: updateVehicleDto.vehicleNumber.trim(),
          plateNumber: updateVehicleDto.plateNumber?.trim(),
          vin: updateVehicleDto.vin?.trim()
        },
        include: {
          branch: true
        }
      });

      return mapVehicle(vehicle);
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Vehicle",
        duplicateMessage: "A vehicle with this number already exists.",
        notFoundMessage: "Vehicle not found."
      });
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.vehicle.delete({
        where: { id }
      });

      return {
        deleted: true,
        id
      };
    } catch (error) {
      handlePrismaError(error, {
        entityName: "Vehicle",
        referenceMessage: "Vehicle cannot be deleted while assignments still reference it.",
        notFoundMessage: "Vehicle not found."
      });
    }
  }
}
