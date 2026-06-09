import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('exercise_prs')
export class ExercisePR {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  exerciseId!: string;

  @Column({ type: 'varchar', length: 255 })
  exerciseName!: string;

  @Column({ type: 'float', default: 0 })
  maxWeightKg!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
