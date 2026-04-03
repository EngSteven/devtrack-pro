import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from '../entities/membership.entity';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector, // Herramienta de NestJS para leer nuestros decoradores
    
    @InjectRepository(Membership)
    private membershipRepository: Repository<Membership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Leemos qué roles exige la ruta
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no tiene el decorador @Roles, dejamos pasar (ya la protegió el AuthGuard)
    if (!requiredRoles) {
      return true;
    }

    // 2. Extraemos los datos de la petición
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Viene del JWT
    const organizationId = request.params.id; // Asumimos que la URL es /organizations/:id

    if (!organizationId) {
      throw new ForbiddenException('Organization ID is missing in the URL parameters');
    }

    // 3. Buscamos el puente (membresía) entre este usuario y esta organización
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: user.sub },
        organization: { id: organizationId },
      },
    });

    // 4. Validaciones de Seguridad Estricta
    if (!membership) {
      throw new ForbiddenException('You do not belong to this organization');
    }

    const hasRole = requiredRoles.includes(membership.role);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Requires one of these roles: ${requiredRoles.join(', ')}`);
    }

    // Pegamos la membresía en el request por si el controlador la necesita luego
    request.membership = membership;
    return true;
  }
}