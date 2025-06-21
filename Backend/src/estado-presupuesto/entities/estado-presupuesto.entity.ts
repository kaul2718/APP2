import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class EstadoPresupuesto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column('text')
  descripcion: string;
  
  // Relación inversa para los presupuestos con este estado
  @OneToMany(() => Presupuesto, (presupuesto) => presupuesto.estado)
  presupuestos: Presupuesto[];
}
