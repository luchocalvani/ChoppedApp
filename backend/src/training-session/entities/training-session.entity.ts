import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('training_sessions')
export class TrainingSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  workoutId!: string;

  @Column({ type: 'varchar', length: 255 })
  workoutName!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  entries!: Array<{
    exerciseId: string;
    name: string;
    done: boolean;
    repsDone: number;
    weightKg: number;
  }>;

  @CreateDateColumn()
  createdAt!: Date;
}
