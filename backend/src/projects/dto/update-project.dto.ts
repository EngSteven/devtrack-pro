import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProjectDto {
  @IsString({ message: 'Project name must be a string' })
  @IsOptional()
  @MinLength(3, { message: 'Project name must be at least 3 characters long' })
  name?: string;

  @IsString(  { message: 'Project description must be a string' } )
  @IsOptional()
  description?: string;

  @IsString({ message: 'Project status must be a string' })
  @IsOptional()
  status?: string; // Para cambiar entre ACTIVE, ARCHIVED, etc.
}