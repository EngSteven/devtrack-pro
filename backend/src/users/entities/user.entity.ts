import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Membership } from '../../organizations/entities/membership.entity';

@Entity('users') // Esto le dice a TypeORM que la tabla en Postgres se llamará 'users'
export class User {
  @PrimaryGeneratedColumn('uuid') // Genera un ID único y seguro (ej: 123e4567-e89b-12d3-a456-426614174000)
  id!: string;

  @Column({ unique: true }) // El correo debe ser único en toda la base de datos
  email!: string;

  @Column() // Aquí guardaremos la contraseña encriptada (NUNCA en texto plano)
  password!: string;

  @Column()
  name!: string;

  @OneToMany(() => Membership, (membership) => membership.user)
  memberships!: Membership[];

  // Campos de auditoría automáticos (muy solicitados en entornos profesionales)
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date;
}