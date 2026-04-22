import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

class RouteSplitImportRowDto {
  @IsString()
  bsid!: string;

  @IsOptional()
  @IsString()
  stopName?: string;

  @IsOptional()
  @IsString()
  sourceRouteNumber?: string;

  @IsOptional()
  @IsString()
  sourceRouteName?: string;
}

class RouteSplitImportRouteDto {
  @IsString()
  routeName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RouteSplitImportRowDto)
  rows!: RouteSplitImportRowDto[];
}

export class PreviewRouteSplitImportDto {
  @IsString()
  branchId!: string;

  @IsOptional()
  @IsString()
  workbookName?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RouteSplitImportRouteDto)
  routes!: RouteSplitImportRouteDto[];
}
