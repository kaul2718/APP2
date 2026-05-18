// Entidad de cabecera para los ajustes de inventario
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AjusteInventarioDetalle } from './ajuste-inventario-detalle.entity';

@Entity('ajuste_inventario')
export class AjusteInventario {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;

  @Column({ type: 'text', nullable: false })
  motivo: string;

  @Column({ type: 'text', nullable: true })
  comentario: string;

  @Column()
  usuarioId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'usuarioId' })
  usuario: User;

  @OneToMany(() => AjusteInventarioDetalle, (detalle) => detalle.ajuste, {
    cascade: true,
  })
  detalles: AjusteInventarioDetalle[];
}
