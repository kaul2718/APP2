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

export type ClientActorMode = 'authenticated' | 'anonymous';
export type ClientEventSource = 'frontend' | 'backend';

@Entity('client_activity_events')
@Index('idx_client_activity_created_at', ['createdAt'])
@Index('idx_client_activity_event_created', ['eventName', 'createdAt'])
@Index('idx_client_activity_module_created', ['module', 'createdAt'])
export class ClientActivityEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'event_name', type: 'varchar', length: 80 })
  eventName: string;

  @Column({ type: 'varchar', length: 50 })
  module: string;

  @Column({ name: 'page_path', type: 'varchar', length: 200 })
  pagePath: string;

  @Column({ name: 'actor_mode', type: 'varchar', length: 20, default: 'anonymous' })
  actorMode: ClientActorMode;

  @Column({ type: 'varchar', length: 20, default: 'frontend' })
  source: ClientEventSource;

  @Column({ name: 'client_user_id', type: 'integer', nullable: true })
  clientUserId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'client_user_id' })
  clientUser?: User | null;

  @Column({ name: 'session_id', type: 'varchar', length: 64, nullable: true })
  sessionId: string | null;

  @Column({ name: 'entity_type', type: 'varchar', length: 50, nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', type: 'varchar', length: 64, nullable: true })
  entityId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, string | number | boolean> | null;

  @Column({ name: 'frontend_version', type: 'varchar', length: 32, nullable: true })
  frontendVersion: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

