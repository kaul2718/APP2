import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TipoActivacion {
  ACTIVACION = 'ACTIVACION',
  RECUPERACION_PRESENCIAL = 'RECUPERACION_PRESENCIAL',
}

@Entity('activaciones_cuenta')
export class ActivacionCuenta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  @Index()
  usuarioId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
  @Index()
  tokenHash: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: TipoActivacion.ACTIVACION,
  })
  tipo: TipoActivacion;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'intentos_fallidos', type: 'int', default: 0 })
  intentosFallidos: number;

  @Column({ name: 'generado_por_id', nullable: true })
  generadoPorId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'generado_por_id' })
  generadoPor: User | null;

  @Column({ name: 'ip_generacion', type: 'varchar', length: 64, nullable: true })
  ipGeneracion: string | null;

  @Column({ name: 'ip_consumo', type: 'varchar', length: 64, nullable: true })
  ipConsumo: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
