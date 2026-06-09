import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreService } from './store.service';

type AuthUser = { userId: string };

@UseGuards(JwtAuthGuard)
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('items')
  getItems() {
    return this.storeService.getItems();
  }

  @Get('collectibles')
  getCollectibles(@Req() req: Request & { user: AuthUser }) {
    return this.storeService.getCollectibles(req.user.userId);
  }

  @Post('buy/:itemId')
  buy(
    @Req() req: Request & { user: AuthUser },
    @Param('itemId') itemId: string,
  ) {
    return this.storeService.buy(req.user.userId, itemId);
  }
}
