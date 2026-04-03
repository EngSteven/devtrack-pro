import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required' })
  @MinLength(3, { message: 'Organization name must be at least 3 characters long' })
  name!: string;
}