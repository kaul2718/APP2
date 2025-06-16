// repuesto.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, UpdateDateColumn, ManyToOne } from 'typeorm';
import { DetalleRepuestos } from '../../detalle-repuestos/entities/detalle-repuesto.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity()
export class Repuesto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigo: string;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precioVenta: number;

  @Column()
  stockActual: number;

  @Column()
  stockMinimo: number;

  @UpdateDateColumn()
  ultimaActualizacion: Date;

  @OneToMany(() => DetalleRepuestos, detalle => detalle.repuesto)
  detallesRepuestos: DetalleRepuestos[];

}