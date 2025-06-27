import {Entity,PrimaryGeneratedColumn,Column,OneToMany,DeleteDateColumn,UpdateDateColumn,} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { HistorialEstadoOrden } from '../../historial-estado-orden/entities/historial-estado-orden.entity';

@Entity('estado_orden')
export class EstadoOrden {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @UpdateDateColumn({ type: 'timestamp' })
  fechaActualizacion: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  // Relación con orden actual (una orden tiene un estado actual)
  @OneToMany(() => Order, (order) => order.estado)
  ordenes: Order[];

  // Relación con historial (estadoAnterior o estadoNuevo)
  @OneToMany(() => HistorialEstadoOrden, (hist) => hist.estadoAnterior)
  historialComoAnterior: HistorialEstadoOrden[];

  @OneToMany(() => HistorialEstadoOrden, (hist) => hist.estadoNuevo)
  historialComoNuevo: HistorialEstadoOrden[];
}
