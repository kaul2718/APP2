import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, DeleteDateColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Marca } from '../../marca/entities/marca.entity';
import { Equipo } from '../../equipo/entities/equipo.entity';

@Entity()
export class Modelo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ default: true })
  estado: boolean;

  @ManyToOne(() => Marca, (marca) => marca.modelos, { onDelete: 'SET NULL', nullable: true })
  marca: Marca;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Equipo, (equipo) => equipo.modelo)
  equipos: Equipo[];
}