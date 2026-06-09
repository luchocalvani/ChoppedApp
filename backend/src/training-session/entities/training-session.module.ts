import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingSession } from './training-session.entity';
import { TrainingSessionsService } from '../training-session.service';
import { TrainingSessionsController } from '../training-session.controller';
import { Workout } from '../../workouts/workouts.entity';
import { User } from '../../users/entities/user.entity';
import { Achievement } from '../../achievements/achievement.entity';
import { ExercisePR } from '../../achievements/exercise-pr.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingSession, Workout, User, Achievement, ExercisePR])],
  controllers: [TrainingSessionsController],
  providers: [TrainingSessionsService],
  exports: [TrainingSessionsService],
})
export class TrainingSessionsModule {}
