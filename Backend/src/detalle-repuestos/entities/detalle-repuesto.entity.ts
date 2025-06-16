// detalle-repuesto.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Repuesto } from '../../repuestos/entities/repuesto.entity';
@Entity()
export class DetalleRepuestos {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2 })
  precioUnitario: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @CreateDateColumn()
  fechaUso: Date;

  @ManyToOne(() => Order, order => order.detallesRepuestos)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: number;

  @ManyToOne(() => Repuesto, repuesto => repuesto.detallesRepuestos)
  @JoinColumn({ name: 'repuestoId' })
  repuesto: Repuesto;

  @Column()
  repuestoId: number;
}