import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, } from 'typeorm';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { Parte } from 'src/parte/entities/parte.entity';

// Se mantiene el nombre físico legado de la tabla para no romper la BD existente
// mientras el dominio y los endpoints ya operan como `DetallePresupuestoItem`.
@Entity('detalle_repuestos')
export class DetallePresupuestoItem {
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

  @ManyToOne(() => Presupuesto, presupuesto => presupuesto.detallesPresupuestoItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'presupuestoId' })
  presupuesto: Presupuesto;

  @Column()
  presupuestoId: number;

  @ManyToOne(() => Parte, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parteId' })
  parte?: Parte;

  @Column({ nullable: true })
  parteId?: number | null;

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
