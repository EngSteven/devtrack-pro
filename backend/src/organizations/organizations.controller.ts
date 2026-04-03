import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuthGuard } from '../auth/auth.guard'; // Importamos el Guardia de seguridad

@UseGuards(AuthGuard) // Al ponerlo aquí arriba, TODAS las rutas de este controlador quedan protegidas
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() createOrganizationDto: CreateOrganizationDto, @Request() req: any) {
    // Gracias al AuthGuard, tenemos el req.user. El 'sub' es el ID del usuario que viaja dentro del JWT.
    const userId = req.user.sub; 
    return this.organizationsService.create(createOrganizationDto, userId);
  }

  @Get()
  findAllMine(@Request() req: any) {
    const userId = req.user.sub;
    return this.organizationsService.findAllForUser(userId);
  }
}