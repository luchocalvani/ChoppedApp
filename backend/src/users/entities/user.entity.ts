import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  alias!: string | null;

  @Column({ type: 'text', nullable: true })
  profileImageUrl!: string | null;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  googleId!: string | null;

  @Column({ type: 'boolean', default: false })
  isAdmin!: boolean;

  @Column({ type: 'int', default: 0 })
  points!: number;

  @Column({ type: 'int', default: 0 })
  xp!: number;

  @Column({ type: 'int', default: 1 })
  level!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
