import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { RolePermission } from '../../role-permission/entities/role-permission.entity';
import { UserRole } from '../../user-role/entities/user-role.entity';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  nombre: string;

  @Column({ unique: true, nullable: false })
  slug: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  @Exclude()
  deletedAt: Date | null;

  @OneToMany(() => RolePermission, (rp) => rp.role, {
    cascade: true,
    eager: true,
  })
  rolePermissions: RolePermission[];

  @OneToMany(() => UserRole, (ur) => ur.rol)
  userRoles: UserRole[];
}
