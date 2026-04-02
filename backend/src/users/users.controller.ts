import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '../auth/auth.guard';


@Controller('users') // La ruta base será http://localhost:3000/users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post() // La ruta final será http://localhost:3000/users/register
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard) // Ponemos al guardia en la puerta de este endpoint
  @Get('me')
  getProfile(@Request() req: any) {
    // Gracias al AuthGuard, req.user ahora contiene el ID y correo del usuario que hizo el login
    return {
      message: 'This is a protected route',
      user: req.user,
    };
  }

}