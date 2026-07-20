import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiWorkoutsService } from './ai-workouts.service';
import { GenerateWorkoutDto } from './dto/generate-workout.dto';

@Controller('ai-workouts')
@UseGuards(JwtAuthGuard)
export class AiWorkoutsController {
  constructor(private readonly aiWorkoutsService: AiWorkoutsService) {}

  // Devuelve una rutina propuesta. NO la guarda: el front muestra el
  // resultado y el usuario decide si la guarda con POST /workouts.
  @UseGuards(ThrottlerGuard)
  @Post('generate')
  generate(@Body() generateWorkoutDto: GenerateWorkoutDto) {
    return this.aiWorkoutsService.generate(generateWorkoutDto.prompt);
  }
}
