import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth') // Ruta base: /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') // Ruta final: POST /auth/login
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}