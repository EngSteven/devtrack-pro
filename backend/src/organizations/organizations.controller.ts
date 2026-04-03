import { Controller, Post, Body, Get, Patch, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { RolesGuard } from './guards/roles.guard'; 
import { Roles } from './decorators/roles.decorator'; 
import { Role } from './enums/role.enum';
import { AuthGuard } from '../auth/auth.guard'; // Importamos el Guardia de seguridad
import { AddMemberDto } from './dto/add-member.dto';


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

  @UseGuards(RolesGuard) // Activamos el cadenero de roles (el AuthGuard ya está activo a nivel de clase)
  @Roles(Role.OWNER, Role.ADMIN) // Solo dueños y admins pueden renombrar
  @Patch(':id') // La URL será PATCH /organizations/:id
  update(
    @Param('id') id: string, 
    @Body() updateOrganizationDto: UpdateOrganizationDto
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.OWNER) // Solo el creador puede destruir la empresa
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER) // Todos pueden ver quién está en el equipo
  @Get(':id/members')
  getMembers(@Param('id') organizationId: string) {
    return this.organizationsService.getMembers(organizationId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN) // Solo Jefes invitan
  @Post(':id/members')
  addMember(
    @Param('id') organizationId: string,
    @Body() addMemberDto: AddMemberDto
  ) {
    return this.organizationsService.addMember(organizationId, addMemberDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN) // Solo Jefes despiden
  @Delete(':id/members/:membershipId')
  removeMember(
    @Param('id') organizationId: string,
    @Param('membershipId') membershipId: string
  ) {
    return this.organizationsService.removeMember(organizationId, membershipId);
  }

  @Get('me/invitations')
  getMyInvitations(@Request() req: any) {
    return this.organizationsService.getMyInvitations(req.user.sub);
  }

  @Patch('invitations/:membershipId/accept')
  acceptInvitation(@Request() req: any, @Param('membershipId') membershipId: string) {
    return this.organizationsService.respondToInvitation(req.user.sub, membershipId, true);
  }

  @Patch('invitations/:membershipId/reject')
  rejectInvitation(@Request() req: any, @Param('membershipId') membershipId: string) {
    return this.organizationsService.respondToInvitation(req.user.sub, membershipId, false);
  }

  // ENDPOINTS DE GESTIÓN DE EQUIPO
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch(':id/members/:membershipId/role')
  updateMemberRole(
    @Param('id') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Body('role') role: Role
  ) {
    return this.organizationsService.updateMemberRole(organizationId, membershipId, role);
  }

  // ENDPOINT PARA ABANDONAR LA ORG
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
  @Delete(':id/leave')
  leaveOrganization(@Request() req: any, @Param('id') organizationId: string) {
    return this.organizationsService.leaveOrganization(organizationId, req.user.sub);
  }

}