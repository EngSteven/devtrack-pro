import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../enums/role.enum';

export class AddMemberDto {
  @IsEmail({}, { message: 'Must be a valid email' })
  @IsNotEmpty()
  email!: string;

  @IsEnum(Role, { message: 'Invalid role' })
  @IsNotEmpty()
  role!: Role; // ADMIN, MEMBER o VIEWER
}