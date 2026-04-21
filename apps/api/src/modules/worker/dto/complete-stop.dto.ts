import { IsOptional, IsString } from "class-validator";

export class CompleteStopDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
