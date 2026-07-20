import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Req,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { RankingResponseDto } from './dto/ranking-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

type AuthUser = { userId: string; email: string; isAdmin: boolean };

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Registro público — no requiere autenticación
  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  // Solo admins pueden listar todos los usuarios
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  // Cualquier usuario autenticado puede ver el ranking (nivel/xp, sin datos sensibles)
  @UseGuards(JwtAuthGuard)
  @Get('ranking')
  getRanking(
    @Req() req: Request & { user: AuthUser },
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<RankingResponseDto> {
    return this.usersService.getRanking(
      req.user.userId,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
    );
  }

  // Propio usuario o admin
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Req() req: Request & { user: AuthUser },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    if (!req.user.isAdmin && req.user.userId !== id) {
      throw new ForbiddenException('No puedes ver datos de otros usuarios');
    }
    return this.usersService.findOne(id);
  }

  // Propio usuario o admin
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() req: Request & { user: AuthUser },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    if (!req.user.isAdmin && req.user.userId !== id) {
      throw new ForbiddenException('No puedes editar datos de otros usuarios');
    }
    if (updateUserDto.isAdmin !== undefined && !req.user.isAdmin) {
      throw new ForbiddenException('Solo los admins pueden cambiar el rol de administrador');
    }
    return this.usersService.update(id, updateUserDto);
  }

  // Propio usuario o admin
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Req() req: Request & { user: AuthUser },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ message: string }> {
    if (!req.user.isAdmin && req.user.userId !== id) {
      throw new ForbiddenException('No puedes eliminar cuentas de otros usuarios');
    }
    return this.usersService.remove(id);
  }
}
