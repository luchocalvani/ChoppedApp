import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from './workouts.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutResponseDto } from './dto/workout-response.dto';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(Workout)
    private readonly workoutsRepository: Repository<Workout>,
  ) {}

  private toResponseDto(workout: Workout): WorkoutResponseDto {
    return {
      id: workout.id,
      name: workout.name,
      exercises: workout.exercises ?? [],
      userId: workout.userId,
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,
    };
  }

  async create(
    userId: string,
    createWorkoutDto: CreateWorkoutDto,
  ): Promise<WorkoutResponseDto> {
    const workout = this.workoutsRepository.create({
      ...createWorkoutDto,
      userId,
    });

    const saved = await this.workoutsRepository.save(workout);
    const savedWorkout = Array.isArray(saved) ? saved[0] : saved;
    return this.toResponseDto(savedWorkout);
  }

  async findAllByUser(userId: string): Promise<WorkoutResponseDto[]> {
    const workouts = await this.workoutsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return workouts.map((w) => this.toResponseDto(w));
  }

  async findOne(id: string, userId: string): Promise<WorkoutResponseDto> {
    const workout = await this.workoutsRepository.findOne({ where: { id } });
    if (!workout) {
      throw new NotFoundException(`Rutina con ID ${id} no encontrada`);
    }
    if (workout.userId !== userId) {
      throw new ForbiddenException('No puedes ver rutinas de otros usuarios');
    }
    return this.toResponseDto(workout);
  }

  async update(
    id: string,
    userId: string,
    updateWorkoutDto: UpdateWorkoutDto,
  ): Promise<WorkoutResponseDto> {
    const workout = await this.workoutsRepository.findOne({ where: { id } });
    if (!workout) {
      throw new NotFoundException(`Rutina con ID ${id} no encontrada`);
    }

    if (workout.userId !== userId) {
      throw new ForbiddenException('No puedes editar rutinas de otros usuarios');
    }

    Object.assign(workout, updateWorkoutDto);
    const saved = await this.workoutsRepository.save(workout);
    return this.toResponseDto(saved);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const workout = await this.workoutsRepository.findOne({ where: { id } });
    if (!workout) {
      throw new NotFoundException(`Rutina con ID ${id} no encontrada`);
    }

    if (workout.userId !== userId) {
      throw new ForbiddenException('No puedes eliminar rutinas de otros usuarios');
    }

    await this.workoutsRepository.remove(workout);
    return { message: `Rutina ${id} eliminada correctamente` };
  }
}
