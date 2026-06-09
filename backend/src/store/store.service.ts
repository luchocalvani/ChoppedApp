import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { STORE_ITEMS } from './store-items.const';
import { UserItem } from './user-item.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(UserItem) private readonly userItemRepo: Repository<UserItem>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  getItems() {
    return STORE_ITEMS;
  }

  async getCollectibles(userId: string) {
    const owned = await this.userItemRepo.find({
      where: { userId },
      order: { purchasedAt: 'ASC' },
    });
    return owned.map((ui) => ({
      ...ui,
      item: STORE_ITEMS.find((i) => i.id === ui.itemId) ?? null,
    }));
  }

  async buy(userId: string, itemId: string) {
    const item = STORE_ITEMS.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Item no encontrado');

    const alreadyOwns = await this.userItemRepo.findOne({ where: { userId, itemId } });
    if (alreadyOwns) throw new BadRequestException('Ya tienes este item');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.points < item.price) throw new BadRequestException('Puntos insuficientes');

    user.points -= item.price;
    await this.userRepo.save(user);

    const userItem = this.userItemRepo.create({ userId, itemId });
    await this.userItemRepo.save(userItem);

    return { success: true, remainingPoints: user.points, item };
  }
}
