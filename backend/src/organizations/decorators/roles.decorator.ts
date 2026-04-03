import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

// Este decorador nos permitirá usar @Roles(Role.OWNER, Role.ADMIN) en nuestros controladores
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);