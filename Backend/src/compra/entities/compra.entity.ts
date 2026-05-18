import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Proveedor } from '../../proveedor/entities/proveedor.entity';
import { User } from '../../users/entities/user.entity';
import { CompraDetalle } from './compra-detalle.entity';

@Entity('compra')
export class Compra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  numeroFactura: string;

  @Column({ type: 'timestamp', nullable: false })
  fecha: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  ivaPorcentaje: number; // stores selected rate (0, 5, 8, 15)

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ivaMonto: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'text', nullable: true })
  comentario: string;

  @Column({ type: 'varchar', length: 30, default: 'Completado' })
  estado: string; // 'Completado', 'Anulado'

  @Column()
  proveedorId: number;

  @ManyToOne(() => Proveedor, { nullable: false })
  @JoinColumn({ name: 'proveedorId' })
  proveedor: Proveedor;

  @Column()
  usuarioId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'usuarioId' })
  usuario: User;

  @OneToMany(() => CompraDetalle, (detalle) => detalle.compra, { cascade: true })
  detalles: CompraDetalle[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
