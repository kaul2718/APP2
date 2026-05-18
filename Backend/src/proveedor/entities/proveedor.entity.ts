import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('proveedor')
export class Proveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: false })
  nombre: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  ruc_nit: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  correo: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
