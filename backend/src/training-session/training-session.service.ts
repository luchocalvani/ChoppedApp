import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingSession } from './entities/training-session.entity';
import { CompleteTrainingDto } from './dto/complete-training.dto';
import { Workout } from '../workouts/workouts.entity';
import { User } from '../users/entities/user.entity';
import { Achievement } from '../achievements/achievement.entity';
import { ExercisePR } from '../achievements/exercise-pr.entity';

const LEVEL_THRESHOLDS = [0, 5, 10, 20, 40, 80, 160, 320, 640, 1280];

function calcLevel(xp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

function pointsForReps(reps: number): number {
  if (reps < 3) return 0;
  if (reps < 6) return 1;
  if (reps <= 8) return 2;
  return 3;
}

@Injectable()
export class TrainingSessionsService {
  constructor(
    @InjectRepository(TrainingSession)
    private readonly sessionsRepo: Repository<TrainingSession>,
    @InjectRepository(Workout)
    private readonly workoutsRepo: Repository<Workout>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ExercisePR)
    private readonly prRepo: Repository<ExercisePR>,
    @InjectRepository(Achievement)
    private readonly achievementsRepo: Repository<Achievement>,
  ) {}

  async complete(userId: string, dto: CompleteTrainingDto) {
    const workout = await this.workoutsRepo.findOne({ where: { id: dto.workoutId } });

    if (!workout) {
      throw new NotFoundException('Rutina no encontrada');
    }
    if (workout.userId !== userId) {
      throw new ForbiddenException('No puedes completar rutinas de otro usuario');
    }
    if (!dto.entries.length) {
      throw new BadRequestException('No hay ejercicios para guardar');
    }
    if (dto.entries.some((e) => !e.done)) {
      throw new BadRequestException('Debes marcar todos los ejercicios antes de terminar');
    }

    // Calculate points earned
    let pointsEarned = 0;
    for (const entry of dto.entries) {
      pointsEarned += pointsForReps(entry.repsDone);
    }

    // Update user points, xp, and level
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user) {
      user.points += pointsEarned;
      user.xp += pointsEarned;
      user.level = calcLevel(user.xp);
      await this.userRepo.save(user);
    }

    // Check for weight PRs and unlock achievements
    const newAchievements: string[] = [];
    for (const entry of dto.entries) {
      if (!entry.weightKg || entry.weightKg <= 0) continue;

      let pr = await this.prRepo.findOne({
        where: { userId, exerciseId: entry.exerciseId },
      });

      const prevMax = pr?.maxWeightKg ?? 0;

      if (entry.weightKg > prevMax) {
        if (!pr) {
          pr = this.prRepo.create({
            userId,
            exerciseId: entry.exerciseId,
            exerciseName: entry.name,
            maxWeightKg: entry.weightKg,
          });
        } else {
          pr.maxWeightKg = entry.weightKg;
        }
        await this.prRepo.save(pr);

        // Check each 20kg milestone crossed for the first time
        for (let milestone = 20; milestone <= entry.weightKg; milestone += 20) {
          if (milestone > prevMax) {
            const exists = await this.achievementsRepo.findOne({
              where: { userId, exerciseId: entry.exerciseId, milestoneKg: milestone },
            });
            if (!exists) {
              const ach = this.achievementsRepo.create({
                userId,
                exerciseId: entry.exerciseId,
                exerciseName: entry.name,
                milestoneKg: milestone,
              });
              await this.achievementsRepo.save(ach);
              newAchievements.push(`${entry.name} - ${milestone}kg`);
            }
          }
        }
      }
    }

    const session = this.sessionsRepo.create({
      userId,
      workoutId: workout.id,
      workoutName: workout.name,
      entries: dto.entries,
    });

    const saved = await this.sessionsRepo.save(session);
    return { ...saved, pointsEarned, newAchievements };
  }

  async mine(userId: string) {
    return this.sessionsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async clearMine(userId: string): Promise<{ deleted: number }> {
    const result = await this.sessionsRepo.delete({ userId });
    return { deleted: result.affected ?? 0 };
  }
}
