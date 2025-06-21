import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, } from 'typeorm';
import { Categoria } from 'src/categoria/entities/categoria.entity';
import { Marca } from 'src/marca/entities/marca.entity';
import { EspecificacionParte } from 'src/especificacion-parte/entities/especificacion-parte.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';

@Entity()
export class Parte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  modelo: string;

  @Column()
  descripcion: string;

  @CreateDateColumn()
  fechaCreacion: Date;

  @Column()
  categoriaId: number;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'categoriaId' })
  categoria: Categoria;

  @Column()
  marcaId: number;

  @ManyToOne(() => Marca)
  @JoinColumn({ name: 'marcaId' })
  marca: Marca;

  @OneToMany(() => EspecificacionParte, (esp) => esp.parte)
  especificaciones: EspecificacionParte[];

  @OneToMany(() => Inventario, (inv) => inv.parte)
  inventarios: Inventario[];

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
