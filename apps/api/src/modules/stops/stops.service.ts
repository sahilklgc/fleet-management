import { Injectable } from "@nestjs/common";
import { ServiceFrequency, StopCategory } from "@lgc/domain-types";
import { PrismaService } from "../database/prisma.service";
import { mapMasterStop } from "../common/utils/domain-mappers";
import { CreateStopDto } from "./dto/create-stop.dto";

function toPrismaStopCategory(category: StopCategory) {
  switch (category) {
    case StopCategory.PressureWashing:
      return "PRESSURE_WASHING" as const;
    case StopCategory.Shelter:
      return "SHELTER" as const;
    case StopCategory.Standalone:
      return "STANDALONE" as const;
  }
}

function toPrismaServiceFrequency(serviceFrequency: ServiceFrequency) {
  switch (serviceFrequency) {
    case ServiceFrequency.SevenDay:
      return "SEVEN_DAY" as const;
    case ServiceFrequency.FiveDay:
      return "FIVE_DAY" as const;
    case ServiceFrequency.Biweekly:
      return "BIWEEKLY" as const;
  }
}

@Injectable()
export class StopsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(category?: string) {
    const stops = await this.prisma.masterStop.findMany({
      where: category
        ? {
            category: toPrismaStopCategory(category as StopCategory)
          }
        : undefined,
      orderBy: {
        clientStopId: "asc"
      }
    });

    return stops.map(mapMasterStop);
  }

  async create(createStopDto: CreateStopDto) {
    const stop = await this.prisma.masterStop.create({
      data: {
        clientStopId: createStopDto.clientStopId.trim().toUpperCase(),
        name: createStopDto.name.trim(),
        latitude: createStopDto.latitude,
        longitude: createStopDto.longitude,
        category: toPrismaStopCategory(createStopDto.category),
        serviceFrequency: toPrismaServiceFrequency(createStopDto.serviceFrequency),
        isActive: createStopDto.isActive,
        importedAt: new Date()
      }
    });

    return mapMasterStop(stop);
  }
}
