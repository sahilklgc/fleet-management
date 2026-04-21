import { IsString, Length } from "class-validator";

export class CreateBranchDto {
  @IsString()
  @Length(2, 12)
  code!: string;

  @IsString()
  @Length(2, 100)
  name!: string;
}
