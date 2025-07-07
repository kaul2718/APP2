import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class EstadoPresupuesto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column('text')
  descripcion: string;

  @Column({ default: true })
  estado: boolean;

  // Relación inversa para los presupuestos con este estado
  @OneToMany(() => Presupuesto, (presupuesto) => presupuesto.estado)
  presupuestos: Presupuesto[];

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

}
