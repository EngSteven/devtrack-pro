import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString( { message: 'Project name must be a string' } )
  @IsNotEmpty({ message: 'Project name is required' })
  @MinLength(3, { message: 'Project name must be at least 3 characters long' })
  name!: string;

  @IsString()
  @IsOptional() // La descripción no es obligatoria
  description?: string;
}