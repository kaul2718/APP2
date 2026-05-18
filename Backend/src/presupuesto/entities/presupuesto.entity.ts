import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, DeleteDateColumn } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { EstadoPresupuesto } from '../../estado-presupuesto/entities/estado-presupuesto.entity';
import { DetallePresupuestoItem } from 'src/detalle-presupuesto-item/entities/detalle-presupuesto-item.entity';

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



  @OneToMany(() => DetallePresupuestoItem, detalle => detalle.presupuesto)
  detallesPresupuestoItems: DetallePresupuestoItem[];



  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

}
