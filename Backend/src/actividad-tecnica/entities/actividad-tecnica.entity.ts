import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { TipoActividadTecnica } from '../../tipo-actividad-tecnica/entities/tipo-actividad-tecnica.entity';

@Entity()
export class ActividadTecnica {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.actividades, { nullable: false })
  @JoinColumn({ name: 'ordenId' })
  orden: Order;

  @Column()
  ordenId: number;

  @ManyToOne(() => TipoActividadTecnica, (tipo) => tipo.actividades, { nullable: false })
  @JoinColumn({ name: 'tipoActividadId' })
  tipoActividad: TipoActividadTecnica;

  @Column()
  tipoActividadId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({ type: 'text' })
  diagnostico: string;

  @Column({ type: 'text' })
  trabajoRealizado: string;


  @Column({ default: true })
  estado: boolean;
  
  @UpdateDateColumn({ nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

}
