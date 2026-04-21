import { IsBoolean, IsEnum, IsNumber, IsString, Length } from "class-validator";
import { ServiceFrequency, StopCategory } from "@lgc/domain-types";

export class CreateStopDto {
  @IsString()
  @Length(2, 40)
  clientStopId!: string;

  @IsString()
  @Length(2, 120)
  name!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsEnum(StopCategory)
  category!: StopCategory;

  @IsEnum(ServiceFrequency)
  serviceFrequency!: ServiceFrequency;

  @IsBoolean()
  isActive!: boolean;
}
