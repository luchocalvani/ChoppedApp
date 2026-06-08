import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TrainingEntryDto {
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsBoolean()
  done!: boolean;

  @IsNumber()
  @Min(0)
  repsDone!: number;

  @IsNumber()
  @Min(0)
  weightKg!: number;
}

export class CompleteTrainingDto {
  @IsString()
  @IsNotEmpty()
  workoutId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrainingEntryDto)
  entries!: TrainingEntryDto[];
}
