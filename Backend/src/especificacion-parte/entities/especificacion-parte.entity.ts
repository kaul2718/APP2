import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
import { Parte } from 'src/parte/entities/parte.entity';
import { TipoEspecificacion } from 'src/tipo-especificacion/entities/tipo-especificacion.entity';

@Entity()
export class EspecificacionParte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  valor: string;

  @Column({ default: true })
  estado: boolean;

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

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
