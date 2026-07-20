import { Module } from '@nestjs/common';
import { ExercisesModule } from '../exercises/exercises.module';
import { AiWorkoutsController } from './ai-workouts.controller';
import { AiWorkoutsService } from './ai-workouts.service';

@Module({
  imports: [ExercisesModule],
  controllers: [AiWorkoutsController],
  providers: [AiWorkoutsService],
})
export class AiWorkoutsModule {}
