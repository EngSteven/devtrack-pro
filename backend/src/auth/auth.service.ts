import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private mailService: MailService
  ) {}

  async login(loginDto: LoginDto) {
    // 1. Buscar al usuario
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Comparar la contraseña de texto plano con el hash de la base de datos
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Generar el Payload (la información pública que viaja dentro del token)
    const payload = { sub: user.id, email: user.email, name: user.name };

    // 4. Firmar y devolver el token
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
  async register(registerDto: RegisterDto) {
    // 1. Verificamos si el correo ya existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    // 2. Encriptamos la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // 3. Creamos el usuario en la base de datos
    const newUser = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
    });

    // 4. Autenticamos al usuario inmediatamente (Auto-login) devolviendo el Token
    const payload = { sub: newUser.id, email: newUser.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { message: 'If that email exists, we have sent a reset link.' };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 1);

    await this.usersService.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expireDate,
    });

    await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If that email exists, we have sent a reset link.' };
  }

  // 👇 NUEVO: Validar Token y Cambiar Contraseña
  async resetPassword(token: string, newPassword: string) {
    // 1. Buscamos directamente en la base de datos por el token
    const user = await this.usersService.findByResetToken(token);

    // 2. Validamos existencia y caducidad
    if (!user) throw new BadRequestException('Invalid or expired reset token');
    if (new Date() > user.resetPasswordExpires!) throw new BadRequestException('Reset token has expired');

    // 3. Encriptamos la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Actualizamos y limpiamos los rastros
    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });

    return { message: 'Password has been successfully reset' };
  }

}