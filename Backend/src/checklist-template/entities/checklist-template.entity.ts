import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TipoEquipo } from '../../tipo-equipo/entities/tipo-equipo.entity';

@Entity('checklist_template')
export class ChecklistTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @ManyToOne(() => TipoEquipo, { nullable: false, eager: true })
  @JoinColumn({ name: 'tipoEquipoId' })
  tipoEquipo: TipoEquipo;

  @Column()
  tipoEquipoId: number;

  @Column({ type: 'jsonb' })
  items: string[]; // Lista de strings con los nombres de los ítems a revisar

  @Column({ default: true })
  estado: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
