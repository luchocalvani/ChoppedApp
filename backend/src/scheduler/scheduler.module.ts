import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workout } from '../workouts/workouts.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from './mail.service';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Workout, User])],
  providers: [SchedulerService, MailService],
})
export class SchedulerModule {}
