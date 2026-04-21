import { IsOptional, IsString, Length } from "class-validator";

export class CreateVehicleDto {
  @IsString()
  branchId!: string;

  @IsString()
  @Length(1, 30)
  vehicleNumber!: string;

  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @IsString()
  vin?: string;
}
