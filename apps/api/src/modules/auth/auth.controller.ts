import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentAuth } from './current-auth.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthContext } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post('login')
  async login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentAuth() auth: AuthContext) {
    return this.authService.me(auth);
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentAuth() auth: AuthContext,
    @Body() payload: ChangePasswordDto,
  ) {
    return this.authService.changePassword(auth, payload);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@CurrentAuth() auth: AuthContext) {
    return this.authService.logout(auth);
  }
}
