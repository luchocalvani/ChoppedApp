import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  exerciseId!: string;

  @Column({ type: 'varchar', length: 255 })
  exerciseName!: string;

  @Column({ type: 'int' })
  milestoneKg!: number;

  @CreateDateColumn()
  earnedAt!: Date;
}
