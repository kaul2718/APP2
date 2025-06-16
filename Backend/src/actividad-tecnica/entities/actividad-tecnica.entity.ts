import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';

@Entity()
export class ActividadTecnica {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'text' })
  diagnostico: string;

  @Column({ type: 'text' })
  trabajoRealizado: string;

  @ManyToOne(() => Order, (orden) => orden.actividades, { 
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'ordenId' }) // Relación explícita con 'ordenId'
  orden: Order;

  @Column()
  ordenId: number;  // Esta columna representa la clave foránea a 'Order'
}
