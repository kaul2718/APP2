import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { EstadoCasillero } from '../../common/enums/estadoCasillero.enum';
@Entity()
export class Casillero {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numero: string;

  @Column({ type: 'enum', enum: EstadoCasillero })
  estado: EstadoCasillero;

  @Column()
  descripcion: string;

  @OneToOne(() => Order, (order) => order.casillero)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ nullable: true })
  orderId: number;

  // ===  campos para soft delete ===
  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}