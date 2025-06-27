import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { EstadoOrden } from 'src/estado-orden/entities/estado-orden.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('historial_estado_orden')
export class HistorialEstadoOrden {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.historialEstados, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ordenId' })
  orden: Order;

  @Column()
  ordenId: number;

  @ManyToOne(() => EstadoOrden, (estado) => estado.historialComoAnterior, { nullable: false })
  @JoinColumn({ name: 'estadoAnteriorId' })
  estadoAnterior: EstadoOrden;

  @Column()
  estadoAnteriorId: number;

  @ManyToOne(() => EstadoOrden, (estado) => estado.historialComoNuevo, { nullable: false })
  @JoinColumn({ name: 'estadoNuevoId' })
  estadoNuevo: EstadoOrden;

  @Column()
  estadoNuevoId: number;

  @CreateDateColumn({ type: 'timestamp' })
  fechaCambio: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'usuarioEstadoId' })
  usuarioEstado: User;

  @Column()
  usuarioEstadoId: number;
}
