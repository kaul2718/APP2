// servicio.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DetalleServicio } from '../../detalle-servicios/entities/detalle-servicio.entity';
@Entity()
export class Servicio {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  codigo: string;

  @Column()
  nombre: string;

  @Column('text')
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  costo: number;

  @OneToMany(() => DetalleServicio, detalle => detalle.servicio)
  detallesServicio: DetalleServicio[];
}