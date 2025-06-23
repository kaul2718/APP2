import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, DeleteDateColumn, JoinColumn } from 'typeorm';
import { IsEmail, Matches, MinLength } from 'class-validator';
import { Role } from '../../common/enums/rol.enum';
import { Order } from '../../orders/entities/order.entity';
import { EvidenciaTecnica } from 'src/evidencia-tecnica/entities/evidencia-tecnica.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  @Matches(/^\d{10}$/, { message: 'La cédula debe tener exactamente 10 dígitos.' })
  cedula: string;

  @Column({ nullable: false })
  nombre: string;

  @Column({ unique: true })
  @IsEmail({}, { message: 'El correo debe ser válido.' })
  correo: string;

  @Column({ nullable: false })
  @Matches(/^[0-9]{10}$/, { message: 'El número de teléfono debe tener 10 dígitos.' })
  telefono: string;

  @Column()
  direccion: string;

  @Column({ nullable: false })
  ciudad: string;

  @Column({ nullable: false, select: false })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;

  @Column({ unique: true, name: 'reset_password_token', nullable: true, select: false })
  resetPasswordToken: string;

  @Column({ type: 'enum', default: Role.CLIENT, enum: Role })
  role: Role;

  @DeleteDateColumn()
  deletedAt: Date;

  // Relación con las órdenes como cliente
  @OneToMany(() => Order, (order) => order.client)
  clientOrders: Order[];

  // Relación con las órdenes como técnico
  @OneToMany(() => Order, (order) => order.technician)
  technicianOrders: Order[];

  
  @OneToMany(() => EvidenciaTecnica, (evidencia) => evidencia.subidoPor)
  evidenciasTecnicas: EvidenciaTecnica[];
}
