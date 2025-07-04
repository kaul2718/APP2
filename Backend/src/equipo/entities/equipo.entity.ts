import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { TipoEquipo } from '../../tipo-equipo/entities/tipo-equipo.entity';
import { Marca } from '../../marca/entities/marca.entity';
import { Modelo } from '../../modelo/entities/modelo.entity';

@Entity()
export class Equipo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numeroSerie: string;

  @OneToMany(() => Order, (order) => order.equipo)
  ordenes: Order[];

  @Column({ default: true })
  estado: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToOne(() => TipoEquipo, (tipoEquipo) => tipoEquipo.equipos, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  tipoEquipo: TipoEquipo;

  @ManyToOne(() => Marca, (marca) => marca.modelos, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  marca: Marca;

  @ManyToOne(() => Modelo, (modelo) => modelo.equipos, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  modelo: Modelo;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
