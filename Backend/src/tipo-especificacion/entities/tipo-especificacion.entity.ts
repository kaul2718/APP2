import { EspecificacionParte } from 'src/especificacion-parte/entities/especificacion-parte.entity';
import { Entity, Column, PrimaryGeneratedColumn, DeleteDateColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tipo_especificacion')
export class TipoEspecificacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ nullable: true, type: 'varchar', length: 50 })
  unidad: string;

  @Column({ default: true })
  estado: boolean;
  
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => EspecificacionParte, (esp) => esp.tipoEspecificacion)
  especificaciones: EspecificacionParte[];

}
