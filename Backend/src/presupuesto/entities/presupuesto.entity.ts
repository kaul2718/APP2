import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { EstadoPresupuesto } from '../../common/enums/estadoPresupuesto.enum';

@Entity()
export class Presupuesto {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  fechaEmision: Date;
  
  @Column({ nullable: true })
  fechaEstadoCambio: Date; // Aquí agregamos la propiedad

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costoManoObra: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costoRepuesto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costoTotal: number;

  @Column({ type: 'enum', enum: EstadoPresupuesto, default: EstadoPresupuesto.PENDIENTE })
  estado: EstadoPresupuesto;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @OneToOne(() => Order, order => order.presupuesto)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: number;
}
