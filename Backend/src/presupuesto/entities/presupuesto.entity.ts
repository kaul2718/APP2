import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { EstadoPresupuesto } from '../../estado-presupuesto/entities/estado-presupuesto.entity';

@Entity()
export class Presupuesto {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, orden => orden.presupuesto)
  @JoinColumn({ name: 'ordenId' })
  orden: Order;

  @Column()
  ordenId: number;

  @CreateDateColumn({ type: 'timestamp' })
  fechaEmision: Date;

  @ManyToOne(() => EstadoPresupuesto, estado => estado.presupuestos)
  @JoinColumn({ name: 'estadoId' })
  estado: EstadoPresupuesto;

  @Column()
  estadoId: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @UpdateDateColumn({ type: 'timestamp' })
  fechaActualizacion: Date;
}
