import { ArrayUnique, IsArray, IsOptional, IsString, Length } from "class-validator";

export class CreateRouteDto {
  @IsString()
  branchId!: string;

  @IsString()
  @Length(1, 20)
  code!: string;

  @IsString()
  @Length(2, 120)
  name!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  stopIds?: string[];
}
