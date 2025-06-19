import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Modelo } from '../../modelo/entities/modelo.entity';

@Entity()
export class Marca {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @OneToMany(() => Modelo, (modelo) => modelo.marca)
  modelos: Modelo[];
}