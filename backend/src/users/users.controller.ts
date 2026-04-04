import { Controller, Post, Body, Get, UseGuards, Request, Patch, Delete } from '@nestjs/common';import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard) // Aplicamos el guardia a todo el controlador, así todas las rutas estarán protegidas
@Controller('users') // La ruta base será http://localhost:3000/users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Request() req: any) {
    // req.user.sub contiene el ID del usuario gracias al AuthGuard
    return this.usersService.findById(req.user.sub); 
  }

  @Patch('me')
  updateProfile(@Request() req: any, @Body() updateData: { name: string }) {
    return this.usersService.updateProfile(req.user.sub, updateData);
  }

  @Delete('me')
  deleteAccount(@Request() req: any) {
    return this.usersService.remove(req.user.sub);
  }

}