import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Repuesto } from '../../repuestos/entities/repuesto.entity';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';

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

  @ManyToOne(() => Presupuesto, presupuesto => presupuesto.detallesRepuestos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'presupuestoId' })
  presupuesto: Presupuesto;

  @Column()
  presupuestoId: number;

  @ManyToOne(() => Repuesto, repuesto => repuesto.detallesRepuestos)
  @JoinColumn({ name: 'repuestoId' })
  repuesto: Repuesto;

  @Column()
  repuestoId: number;

  @Column({ default: true })
  estado: boolean;

  //Opcional: para guardar razones de modificación

  @Column({ type: 'text', nullable: true })
  comentario: string;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
