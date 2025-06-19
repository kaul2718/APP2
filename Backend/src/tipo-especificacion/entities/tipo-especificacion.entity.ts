import { EspecificacionParte } from 'src/especificacion-parte/entities/especificacion-parte.entity';
import { Entity, Column, PrimaryGeneratedColumn, DeleteDateColumn, OneToMany } from 'typeorm';

@Entity('tipo_especificacion')
export class TipoEspecificacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 50 })
  unidad: string;

  @DeleteDateColumn()
  deletedAt?: Date;
  
  @OneToMany(() => EspecificacionParte, (esp) => esp.tipoEspecificacion)
  especificaciones: EspecificacionParte[];

}
