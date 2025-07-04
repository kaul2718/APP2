import { Entity, PrimaryGeneratedColumn, Column, OneToMany, UpdateDateColumn, OneToOne, JoinColumn, DeleteDateColumn, CreateDateColumn, } from 'typeorm';
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

  @Column({ default: true })
  estado: boolean;

  @Column('decimal', { precision: 10, scale: 2 })
  precioVenta: number;

  // Relación con Parte
  @OneToOne(() => Parte)
  @JoinColumn({ name: 'parteId' })
  parte: Parte;

  @Column()
  parteId: number;

  // Relación con detalle repuestos
  @OneToMany(() => DetalleRepuestos, detalle => detalle.repuesto)
  detallesRepuestos: DetalleRepuestos[];

  //CREATE UPDATE DELETE
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;


}
