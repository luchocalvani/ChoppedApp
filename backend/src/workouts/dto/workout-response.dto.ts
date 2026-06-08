export class WorkoutResponseDto {
  id!: string;
  name!: string;
  exercises!: Array<{
    exerciseId: string;
    name: string;
    bodyPart?: string;
    equipment?: string;
    target?: string;
    gifUrl?: string;
  }>;
  userId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
