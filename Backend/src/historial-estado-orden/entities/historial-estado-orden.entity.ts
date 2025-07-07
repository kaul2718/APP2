import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { EstadoOrden } from '../../estado-orden/entities/estado-orden.entity';
import { User } from '../../users/entities/user.entity';

@Entity('historial_estado_orden')
export class HistorialEstadoOrden {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.historialEstados, {
    nullable: false,
    onDelete: 'CASCADE'
  })

  @JoinColumn({ name: 'ordenId' })
  orden: Order;

  @ManyToOne(() => EstadoOrden, {
    nullable: false,
    eager: true // Para cargar automáticamente el estado
  })
  
  @JoinColumn({ name: 'estadoOrdenId' })
  estadoOrden: EstadoOrden;

  @CreateDateColumn({ type: 'timestamp' })
  fechaCambio: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @ManyToOne(() => User, {
    nullable: false,
    eager: true // Para cargar automáticamente el usuario
  })
  @JoinColumn({ name: 'usuarioId' })
  usuario: User;

  // Constructor para facilitar la creación
  constructor(orden?: Order, estadoOrden?: EstadoOrden, usuario?: User) {
    if (orden) this.orden = orden;
    if (estadoOrden) this.estadoOrden = estadoOrden;
    if (usuario) this.usuario = usuario;
    this.fechaCambio = new Date();
  }
}