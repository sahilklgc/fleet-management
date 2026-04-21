import { IsOptional, IsString, Length } from "class-validator";

export class CreateEmployeeDto {
  @IsString()
  branchId!: string;

  @IsString()
  @Length(2, 30)
  employeeCode!: string;

  @IsString()
  @Length(1, 50)
  firstName!: string;

  @IsString()
  @Length(1, 50)
  lastName!: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
