import {  Entity, PrimaryGeneratedColumn, Column, ManyToOne,JoinColumn,CreateDateColumn,UpdateDateColumn,} from 'typeorm';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { TipoManoObra } from 'src/tipo-mano-obra/entities/tipo-mano-obra.entity';

@Entity('detalle_mano_obra')
export class DetalleManoObra {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Presupuesto, (presupuesto) => presupuesto.detallesManoObra, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'presupuestoId' })
  presupuesto: Presupuesto;

  @Column()
  presupuestoId: number;

  @ManyToOne(() => TipoManoObra, (tipo) => tipo.detalles, { eager: true })
  @JoinColumn({ name: 'tipoManoObraId' })
  tipoManoObra: TipoManoObra;

  @Column()
  tipoManoObraId: number;

  @Column('int', { default: 1 })
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2 })
  costoUnitario: number;

  @Column('decimal', { precision: 10, scale: 2 })
  costoTotal: number;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
