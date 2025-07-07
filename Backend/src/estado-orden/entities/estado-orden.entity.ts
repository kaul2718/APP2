import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  DeleteDateColumn, 
  UpdateDateColumn, 
  CreateDateColumn 
} from 'typeorm';
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

  @Column({ default: true })
  estado: boolean;

  // Relación con orden actual (una orden tiene un estado actual)
  @OneToMany(() => Order, (order) => order.estadoOrden)
  estadoOrdenes: Order[];

  // Relación con historial (ahora solo hay una relación con estadoOrden)
  @OneToMany(() => HistorialEstadoOrden, (hist) => hist.estadoOrden)
  historialEstados: HistorialEstadoOrden[];

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}