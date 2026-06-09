import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { UserItem } from './user-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserItem, User])],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}
