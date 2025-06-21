import {Entity,PrimaryGeneratedColumn,Column,ManyToOne,JoinColumn,CreateDateColumn,} from 'typeorm';
import { Parte } from 'src/parte/entities/parte.entity';

@Entity()
export class Inventario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cantidad: number;

  @Column()
  stockMinimo: number;

  @Column()
  ubicacion: string;

  @CreateDateColumn({ type: 'timestamp' })
  ultimaActualizacion: Date;

  @ManyToOne(() => Parte, (parte) => parte.inventarios, { eager: true })
  @JoinColumn({ name: 'parteId' })
  parte: Parte;

  @Column()
  parteId: number;

  // === Soft Delete ===
  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
