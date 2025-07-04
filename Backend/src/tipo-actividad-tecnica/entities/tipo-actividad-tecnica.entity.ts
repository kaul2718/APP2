import { ActividadTecnica } from 'src/actividad-tecnica/entities/actividad-tecnica.entity';
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, DeleteDateColumn, OneToMany, CreateDateColumn } from 'typeorm';

@Entity()
export class TipoActividadTecnica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  estado: boolean;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => ActividadTecnica, (actividad) => actividad.tipoActividad)
  actividades: ActividadTecnica[];

}
