import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity('workouts')
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Days of week: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  @Column({ type: 'simple-array', nullable: true, default: null })
  scheduleDays!: number[] | null;

  // Local Argentina time, e.g. "16:00"
  @Column({ type: 'varchar', length: 5, nullable: true, default: null })
  scheduleTime!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  exercises!: Array<{
    exerciseId: string;
    name: string;
    bodyPart?: string;
    equipment?: string;
    target?: string;
    gifUrl?: string;
  }>;
}
