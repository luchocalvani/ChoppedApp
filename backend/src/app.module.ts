import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ExercisesModule } from './exercises/exercises.module';
import { UsersModule } from './users/users.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { TrainingSessionsModule } from './training-session/entities/training-session.module';
import { GymsModule } from './gyms/gyms.module';
import { StoreModule } from './store/store.module';
import { AchievementsModule } from './achievements/achievements.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { DbLogger } from './db-logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASS', 'postgres'),
        database: configService.get<string>('DB_NAME', 'chopped'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logger: new DbLogger(),
      }),
    }),
    UsersModule,
    AuthModule,
    WorkoutsModule,
    ExercisesModule,
    TrainingSessionsModule,
    GymsModule,
    StoreModule,
    AchievementsModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
