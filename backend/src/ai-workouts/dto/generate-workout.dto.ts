import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateWorkoutDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  prompt!: string;
}
