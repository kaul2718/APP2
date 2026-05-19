import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, DeleteDateColumn, JoinColumn, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { IsEmail, Matches, MinLength } from 'class-validator';
import { Exclude } from 'class-transformer';
import { Order } from '../../orders/entities/order.entity';
import { EvidenciaTecnica } from 'src/evidencia-tecnica/entities/evidencia-tecnica.entity';
import { UserRole } from '../../user-role/entities/user-role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  @Matches(/^\d{10}$/, { message: 'La cédula debe tener exactamente 10 dígitos.' })
  cedula: string;

  @Column({ nullable: false })
  nombre: string;

  @Column({ nullable: true })
  apellido: string;

  @Column({ unique: true })
  @IsEmail({}, { message: 'El correo debe ser válido.' })
  correo: string;

  @Column({ nullable: false })
  @Matches(/^[0-9]{9,10}$/, { message: 'El número de teléfono debe tener entre 9 y 10 dígitos.' })
  telefono: string;

  @Column()
  direccion: string;

  @Column({ nullable: false })
  ciudad: string;

  @Column({ nullable: true, select: false })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @Exclude()
  password: string;

  @Column({ unique: true, name: 'reset_password_token', nullable: true, select: false })
  @Exclude()
  resetPasswordToken: string;

  @Column({ default: true })
  estado: boolean;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  @Exclude()
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  updatedAt: Date;


  // Relación con las órdenes como cliente
  @OneToMany(() => Order, (order) => order.client)
  clientOrders: Order[];

  // Relación con las órdenes como técnico
  @OneToMany(() => Order, (order) => order.technician)
  technicianOrders: Order[];

  // Relación con las órdenes como recepcionista
  @OneToMany(() => Order, (order) => order.recepcionista)
  recepcionistaOrders: Order[];

  // Relación con las evidencias Tecnicas subidas - fotos
  @OneToMany(() => EvidenciaTecnica, (evidencia) => evidencia.subidoPor)
  evidenciasTecnicas: EvidenciaTecnica[];

  // Relación con los roles del usuario
  @OneToMany(() => UserRole, (userRole) => userRole.user, {
    cascade: true,
    eager: true,
  })
  userRoles: UserRole[];
}
