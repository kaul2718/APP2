import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Compra } from './compra.entity';
import { Parte } from '../../parte/entities/parte.entity';

@Entity('compra_detalle')
export class CompraDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  compraId: number;

  @ManyToOne(() => Compra, (compra) => compra.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'compraId' })
  compra: Compra;

  @Column()
  parteId: number;

  @ManyToOne(() => Parte, { nullable: false })
  @JoinColumn({ name: 'parteId' })
  parte: Parte;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'boolean', default: true })
  actualizarCosto: boolean;
}
