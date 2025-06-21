import {Entity,PrimaryGeneratedColumn, Column,OneToMany,UpdateDateColumn,OneToOne,JoinColumn,} from 'typeorm';
import { DetalleRepuestos } from '../../detalle-repuestos/entities/detalle-repuesto.entity';
import { Parte } from '../../parte/entities/parte.entity';

@Entity()
export class Repuesto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precioVenta: number;

  @UpdateDateColumn()
  ultimaActualizacion: Date;

  // Relación con Parte
  @OneToOne(() => Parte)
  @JoinColumn({ name: 'parteId' })
  parte: Parte;

  @Column()
  parteId: number;

  // Relación con detalle repuestos
  @OneToMany(() => DetalleRepuestos, detalle => detalle.repuesto)
  detallesRepuestos: DetalleRepuestos[];

  // Soft delete
  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
