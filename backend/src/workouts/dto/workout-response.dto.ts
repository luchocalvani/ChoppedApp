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
  scheduleDays!: number[] | null;
  scheduleTime!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
