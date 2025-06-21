import {  Entity,PrimaryGeneratedColumn,Column,ManyToOne,JoinColumn,DeleteDateColumn,} from 'typeorm';
import { Parte } from 'src/parte/entities/parte.entity';
import { TipoEspecificacion } from 'src/tipo-especificacion/entities/tipo-especificacion.entity';

@Entity()
export class EspecificacionParte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  valor: string;

  @ManyToOne(() => Parte, (parte) => parte.especificaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parteId' })
  parte: Parte;

  @Column()
  parteId: number;

  @ManyToOne(() => TipoEspecificacion, (tipo) => tipo.especificaciones, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tipoEspecificacionId' })
  tipoEspecificacion: TipoEspecificacion;

  @Column()
  tipoEspecificacionId: number;

  @Column({ default: false })
  isDeleted: boolean;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
