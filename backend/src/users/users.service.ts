import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { RankingResponseDto } from './dto/ranking-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      alias: user.alias ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      email: user.email,
      isAdmin: user.isAdmin,
      points: user.points ?? 0,
      xp: user.xp ?? 0,
      level: user.level ?? 1,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { name, email, password } = createUserDto;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El email ya esta registrado');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      name,
      alias: null,
      profileImageUrl: null,
      email,
      passwordHash,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.toResponseDto(savedUser);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => this.toResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return this.toResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailTaken = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (emailTaken) {
        throw new ConflictException('El email ya esta registrado');
      }
    }

    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    user.name = updateUserDto.name ?? user.name;
    user.alias = updateUserDto.alias ?? user.alias;
    user.profileImageUrl = updateUserDto.profileImageUrl ?? user.profileImageUrl;
    user.email = updateUserDto.email ?? user.email;
    if (updateUserDto.isAdmin !== undefined) {
      user.isAdmin = updateUserDto.isAdmin;
    }

    const updatedUser = await this.usersRepository.save(user);
    return this.toResponseDto(updatedUser);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    await this.usersRepository.remove(user);
    return { message: `Usuario ${id} eliminado correctamente` };
  }

  async getRanking(
    requestingUserId: string,
    page = 1,
    pageSize = 10,
  ): Promise<RankingResponseDto> {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safePageSize = Math.min(50, Math.max(1, Math.floor(pageSize) || 10));
    const skip = (safePage - 1) * safePageSize;

    const [users, total] = await this.usersRepository.findAndCount({
      order: { level: 'DESC', xp: 'DESC' },
      skip,
      take: safePageSize,
    });

    const items = users.map((user, idx) => ({
      id: user.id,
      alias: user.alias,
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      level: user.level,
      xp: user.xp,
      rank: skip + idx + 1,
    }));

    let myRank: number | null = null;
    const me = await this.usersRepository.findOne({ where: { id: requestingUserId } });
    if (me) {
      const higherCount = await this.usersRepository
        .createQueryBuilder('u')
        .where('u.level > :level', { level: me.level })
        .orWhere('u.level = :level AND u.xp > :xp', { level: me.level, xp: me.xp })
        .getCount();
      myRank = higherCount + 1;
    }

    return { items, total, page: safePage, pageSize: safePageSize, myRank };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOrCreateFromGoogle(profile: {
    googleId: string;
    email: string;
    name: string;
    profileImageUrl: string | null;
  }): Promise<User> {
    let user = await this.usersRepository.findOne({ where: { googleId: profile.googleId } });

    if (!user) {
      user = await this.usersRepository.findOne({ where: { email: profile.email } });
    }

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.googleId;
        await this.usersRepository.save(user);
      }
      return user;
    }

    const newUser = this.usersRepository.create({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      profileImageUrl: profile.profileImageUrl,
      passwordHash: null,
    });

    return this.usersRepository.save(newUser);
  }
}
