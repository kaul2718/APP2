import { Entity, PrimaryGeneratedColumn, Column, OneToMany, UpdateDateColumn, DeleteDateColumn, CreateDateColumn, } from 'typeorm';
import { Notificacion } from 'src/notificacion/entities/notificacion.entity';
@Entity()
export class TipoNotificacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  estado: boolean;
  
  //DATOS MANEJADOS POR EL SISTEMA
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
  
  //RELACION CON NOTIFICACION
  @OneToMany(() => Notificacion, (notificacion) => notificacion.tipo)
  notificaciones: Notificacion[];
}
