import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name } = createUserDto;

    // 1. Hashear (encriptar) la contraseña
    // El "10" es el factor de costo (salt rounds). 
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Crear la instancia del usuario con la contraseña hasheada
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    try {
      // 3. Guardar en la base de datos
      const savedUser = await this.userRepository.save(user);
      
      // 4. No devolver la contraseña en la respuesta
      delete (savedUser as any).password;
      
      return savedUser;
    } catch (error: any) {
      // Manejo de errores específicos de PostgreSQL (23505 = unique_violation)
      if (error.code === '23505') {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  // Método para buscar un usuario por su correo
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

}