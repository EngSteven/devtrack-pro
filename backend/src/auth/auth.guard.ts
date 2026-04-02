import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Esta función decide si la petición pasa (true) o se rechaza (false / Exception)
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }
    
    try {
      // Intentamos descifrar el token usando nuestra llave secreta
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      
      // Si el token es válido, extraemos la información del usuario (id, email)
      // y la pegamos en el objeto "request" para que el resto del sistema sepa quién hizo la petición.
      request['user'] = payload;
      
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    
    return true; // El usuario pasa al controlador
  }

  // Función auxiliar para extraer el token del formato "Bearer <token>"
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}