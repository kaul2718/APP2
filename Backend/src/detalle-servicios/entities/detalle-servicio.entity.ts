// detalle-servicio.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Servicio } from 'src/servicios/entities/servicio.entity';

@Entity()
export class DetalleServicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: number;

  @ManyToOne(() => Servicio, servicio => servicio.detallesServicio)
  @JoinColumn({ name: 'servicioId' })
  servicio: Servicio;

  @Column()
  servicioId: number;
}
