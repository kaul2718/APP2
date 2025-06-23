import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Repuesto } from '../../repuestos/entities/repuesto.entity';
import { EstadoDetalleRepuesto } from 'src/common/enums/estadoDetalleRepuesto';


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

  
  // Nuevo campo para estado del detalle
  @Column({ type: 'enum', enum: EstadoDetalleRepuesto, default: EstadoDetalleRepuesto.ACTIVO })
  estado: EstadoDetalleRepuesto;


  // 📝 Opcional: para guardar razones de modificación/anulación
  @Column({ type: 'text', nullable: true })
  comentario: string;
}
