import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post()
  create(
    @Req() req: Request & { user: { userId: string } },
    @Body() createWorkoutDto: CreateWorkoutDto,
  ) {
    return this.workoutsService.create(req.user.userId, createWorkoutDto);
  }

  @Get()
  findAll(@Req() req: Request & { user: { userId: string } }) {
    return this.workoutsService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  findOne(
    @Req() req: Request & { user: { userId: string } },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.workoutsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Req() req: Request & { user: { userId: string } },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateWorkoutDto: UpdateWorkoutDto,
  ) {
    return this.workoutsService.update(id, req.user.userId, updateWorkoutDto);
  }

  @Delete(':id')
  remove(
    @Req() req: Request & { user: { userId: string } },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.workoutsService.remove(id, req.user.userId);
  }
}

