import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';
import { Categoria } from 'src/categoria/entities/categoria.entity';
import { Marca } from 'src/marca/entities/marca.entity';

@Entity()
export class Parte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  modelo: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true, length: 80, unique: true })
  codigoInterno?: string | null;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  costo: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  precio1: number; // PVP

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  precio2: number; // Mayorista

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  precio3: number; // Especial

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  precio4: number; // Distribuidor

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  ivaTarifa: number; // 0, 12, 15 etc

  @Column('decimal', { precision: 12, scale: 3, default: 0 })
  stock: number; // 3 decimales para fraccionamiento

  @Column('decimal', { precision: 12, scale: 3, default: 0 })
  stockMinimo: number;

  @Column({ nullable: true })
  ubicacion: string;

  @Column({ default: 'Unidad' })
  unidadMedida: string;

  @Column({ default: false })
  permiteModificarPrecio: boolean;

  @Column({ default: false })
  permiteFraccionar: boolean;

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

  /*CONTROL */
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
