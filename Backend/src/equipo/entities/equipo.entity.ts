import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity()
export class Equipo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tipoEquipo: string;

  @Column()
  marca: string;

  @Column()
  modelo: string;

  @Column({ unique: true })
  numeroSerie: string;

  // Relación 1:1 con la orden de trabajo
  @OneToOne(() => Order, (order) => order.equipo, { onDelete: 'SET NULL' }) // Cambio aquí
  @JoinColumn({ name: 'orderId' }) // clave foránea 
  order: Order;

  @Column({ default: false })
  isDeleted: boolean;  // Indica si el equipo ha sido eliminado lógicamente

}