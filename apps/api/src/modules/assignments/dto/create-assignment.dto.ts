import { IsDateString, IsString } from "class-validator";

export class CreateAssignmentDto {
  @IsString()
  routeId!: string;

  @IsString()
  employeeId!: string;

  @IsString()
  vehicleId!: string;

  @IsDateString()
  assignmentDate!: string;
}
