import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './achievement.entity';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementsRepo: Repository<Achievement>,
  ) {}

  async mine(userId: string) {
    const achievements = await this.achievementsRepo.find({
      where: { userId },
      order: { earnedAt: 'DESC' },
    });
    return { count: achievements.length, achievements };
  }
}
