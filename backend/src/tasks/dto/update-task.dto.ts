import { PartialType } from '@nestjs/mapped-types'; // npx border instalar esto si falla: npm i @nestjs/mapped-types
import { CreateTaskDto } from './create-task.dto';

// PartialType hace que todos los campos de CreateTaskDto sean opcionales (ideal para Drag & Drop donde solo mandamos el nuevo 'status')
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}