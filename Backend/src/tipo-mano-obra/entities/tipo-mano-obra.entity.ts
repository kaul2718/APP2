import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DetalleManoObra } from '../../detalle-mano-obra/entities/detalle-mano-obra.entity';

@Entity('tipo_mano_obra')
export class TipoManoObra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ unique: true })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costo: number;

  @OneToMany(() => DetalleManoObra, (detalle) => detalle.tipoManoObra)
  detalles: DetalleManoObra[];
}
