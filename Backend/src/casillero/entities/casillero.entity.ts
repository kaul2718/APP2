import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, DeleteDateColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { EstadoCasillero } from '../../common/enums/estadoCasillero.enum';
@Entity()
export class Casillero {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigo: string;

  @Column({ type: 'enum', enum: EstadoCasillero })
  situacion: EstadoCasillero;

  @Column()
  descripcion: string;

  @Column({ default: true })
  estado: boolean;

  //RELACIONES//
  @OneToOne(() => Order, (order) => order.casillero)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ nullable: true })
  orderId: number;

  // MANEJO DEL SISTEMA
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}