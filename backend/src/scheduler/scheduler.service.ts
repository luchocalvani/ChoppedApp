import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from '../workouts/workouts.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from './mail.service';

// Argentina = UTC-3, no DST
function getArgentinaIn30Min(): { day: number; hhmm: string } {
  const ms = Date.now() + 30 * 60 * 1000 - 3 * 60 * 60 * 1000;
  const d = new Date(ms);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return { day, hhmm: `${hh}:${mm}` };
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Workout) private readonly workoutsRepo: Repository<Workout>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  @Cron('* * * * *') // every minute
  async checkReminders() {
    const { day, hhmm } = getArgentinaIn30Min();

    // Find workouts scheduled at exactly hhmm on day
    const workouts = await this.workoutsRepo
      .createQueryBuilder('w')
      .where('w.scheduleTime = :time', { time: hhmm })
      .andWhere('w.scheduleDays IS NOT NULL')
      .getMany();

    for (const workout of workouts) {
      const days = (workout.scheduleDays ?? []).map(Number);
      if (!days.includes(day)) continue;

      const user = await this.usersRepo.findOne({ where: { id: workout.userId } });
      if (!user) continue;

      await this.mailService.sendWorkoutReminder(
        user.email,
        user.alias || user.name,
        workout.name,
        hhmm,
      );
    }
  }
}
