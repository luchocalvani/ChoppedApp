import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

interface GoogleUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email, isAdmin: user.isAdmin };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async loginWithGoogle(user: GoogleUser): Promise<{ accessToken: string }> {
    const payload = { sub: user.id, email: user.email, isAdmin: user.isAdmin };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }
}
