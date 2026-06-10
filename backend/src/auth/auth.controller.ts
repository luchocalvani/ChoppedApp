import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

interface GoogleUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(ThrottlerGuard)
  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: GoogleUser },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Res() res: any,
  ) {
    const { accessToken } = await this.authService.loginWithGoogle(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request & { user: { userId: string; email: string } }) {
    return req.user;
  }
}
