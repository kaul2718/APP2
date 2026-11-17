import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type AuditActorType = 'employee' | 'client' | 'system' | 'anonymous';
export type AuditStatus = 'SUCCESS' | 'FAILURE';

@Entity('audit_logs')
@Index('idx_audit_logs_created_at', ['createdAt'])
@Index('idx_audit_logs_module_created', ['module', 'createdAt'])
@Index('idx_audit_logs_actor_created', ['actorUserId', 'createdAt'])
@Index('idx_audit_logs_entity_created', ['entityType', 'entityId', 'createdAt'])
@Index('idx_audit_logs_action_status', ['action', 'status', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'actor_user_id', type: 'integer', nullable: true })
  actorUserId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser?: User | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 30, nullable: true })
  actorRole: string | null;

  @Column({ name: 'actor_type', type: 'varchar', length: 20, default: 'system' })
  actorType: AuditActorType;

  @Column({ type: 'varchar', length: 80 })
  action: string;

  @Column({ type: 'varchar', length: 50 })
  module: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 60, nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', type: 'varchar', length: 64, nullable: true })
  entityId: string | null;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: Record<string, any> | null;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: Record<string, any> | null;

  @Column({ name: 'changed_fields', type: 'text', array: true, nullable: true })
  changedFields: string[] | null;

  @Column({ type: 'varchar', length: 20, default: 'SUCCESS' })
  status: AuditStatus;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ name: 'request_id', type: 'varchar', length: 64, nullable: true })
  requestId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

