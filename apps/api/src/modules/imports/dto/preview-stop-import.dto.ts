import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { ServiceFrequency, StopCategory } from "@lgc/domain-types";

class StopImportRowDto {
  @IsString()
  clientStopId!: string;

  @IsString()
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

export class PreviewStopImportDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StopImportRowDto)
  rows!: StopImportRowDto[];
}
