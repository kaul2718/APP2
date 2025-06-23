import { ActividadTecnica } from 'src/actividad-tecnica/entities/actividad-tecnica.entity';
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';

@Entity()
export class TipoActividadTecnica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ default: false })
  isDeleted: boolean;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ActividadTecnica, (actividad) => actividad.tipoActividad)
  actividades: ActividadTecnica[];

}
