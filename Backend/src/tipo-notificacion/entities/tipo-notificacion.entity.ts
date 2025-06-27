import {Entity,PrimaryGeneratedColumn,Column,OneToMany,UpdateDateColumn,DeleteDateColumn,} from 'typeorm';
import { Notificacion } from 'src/notificacion/entities/notificacion.entity';
@Entity()
export class TipoNotificacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: false })
  isDeleted: boolean;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt?: Date;

  @OneToMany(() => Notificacion, (notificacion) => notificacion.tipo)
  notificaciones: Notificacion[];
}
