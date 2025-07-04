import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, } from 'typeorm';
import { Parte } from 'src/parte/entities/parte.entity';

@Entity()
export class Inventario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cantidad: number;

  @Column({ default: true })
  estado: boolean;
  
  @Column()
  stockMinimo: number;

  @Column()
  ubicacion: string;

  @ManyToOne(() => Parte, (parte) => parte.inventarios, { eager: true })
  @JoinColumn({ name: 'parteId' })
  parte: Parte;

  @Column()
  parteId: number;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
