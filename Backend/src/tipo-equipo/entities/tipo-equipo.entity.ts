import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Equipo } from '../../equipo/entities/equipo.entity';

@Entity()
export class TipoEquipo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @OneToMany(() => Equipo, (equipo) => equipo.tipoEquipo)
  equipos: Equipo[];
}
