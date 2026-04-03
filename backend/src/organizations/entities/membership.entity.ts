import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from './organization.entity';
import { Role } from '../enums/role.enum';

@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Guardamos el rol como un Enum en la base de datos
  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role!: Role;

  // Relación Muchos a Uno con User
  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Relación Muchos a Uno con Organization
  @ManyToOne(() => Organization, (organization) => organization.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;
}