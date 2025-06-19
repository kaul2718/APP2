import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Marca } from '../../marca/entities/marca.entity';
import { Equipo } from '../../equipo/entities/equipo.entity';

@Entity()
export class Modelo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @ManyToOne(() => Marca, (marca) => marca.modelos, { onDelete: 'SET NULL', nullable: true })
  marca: Marca;

  @Column({ default: false })
  isDeleted: boolean;  // Campo para borrado lógico

  @OneToMany(() => Equipo, (equipo) => equipo.modelo)
  equipos: Equipo[];
}