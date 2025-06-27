import {  Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,DeleteDateColumn,ManyToOne,JoinColumn,} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { TipoNotificacion } from '../../tipo-notificacion/entities/tipo-notificacion.entity';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id: number;

  // Relación con el usuario destinatario
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'usuarioId' })
  usuario: User;

  @Column()
  usuarioId: number;

  // Relación opcional con una orden de servicio
  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'ordenServicioId' })
  ordenServicio?: Order;

  @Column({ nullable: true })
  ordenServicioId?: number;

  // Relación con el tipo de notificación
  @ManyToOne(() => TipoNotificacion, { nullable: false })
  @JoinColumn({ name: 'tipoId' })
  tipo: TipoNotificacion;

  @Column()
  tipoId: number;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ default: false })
  leido: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  fechaEnvio: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
