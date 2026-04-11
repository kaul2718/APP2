import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, DeleteDateColumn, UpdateDateColumn, } from 'typeorm';
import { Categoria } from 'src/categoria/entities/categoria.entity';
import { Marca } from 'src/marca/entities/marca.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';

@Entity()
export class Parte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  modelo: string;

  @Column()
  descripcion: string;

  @Column({ nullable: true, length: 80 })
  codigoInterno?: string | null;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  precioReferencia: number;

  @Column({ default: true })
  estado: boolean;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'categoriaId' })
  categoria: Categoria;

  @Column()
  categoriaId: number;

  @ManyToOne(() => Marca)
  @JoinColumn({ name: 'marcaId' })
  marca: Marca;

  @Column()
  marcaId: number;

  @OneToMany(() => Inventario, (inv) => inv.parte)
  inventarios: Inventario[];

  /*CONTROL */
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
