import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AjusteInventario } from './ajuste-inventario.entity';
import { Parte } from '../../parte/entities/parte.entity';

@Entity('ajuste_inventario_detalle')
export class AjusteInventarioDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ajusteId: number;

  @ManyToOne(() => AjusteInventario, (ajuste) => ajuste.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ajusteId' })
  ajuste: AjusteInventario;

  @Column()
  parteId: number;

  @ManyToOne(() => Parte, { nullable: false })
  @JoinColumn({ name: 'parteId' })
  parte: Parte;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  stockSistema: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  stockFisico: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  diferencia: number;
}
