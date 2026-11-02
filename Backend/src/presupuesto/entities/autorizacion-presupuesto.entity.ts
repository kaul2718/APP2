import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Presupuesto } from './presupuesto.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { DocumentoOrden } from '../../documentos-orden/entities/documento-orden.entity';

export enum DecisionPresupuesto {
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

export enum ModalidadAutorizacion {
  PRESENCIAL_FIRMA = 'PRESENCIAL_FIRMA',
  TOKEN_ODS_PRIVADO = 'TOKEN_ODS_PRIVADO',
  PORTAL_CLIENTE_AUTENTICADO = 'PORTAL_CLIENTE_AUTENTICADO',
}

@Entity('autorizaciones_presupuesto')
export class AutorizacionPresupuesto {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Presupuesto, (presupuesto) => presupuesto.autorizaciones, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'presupuestoId' })
  presupuesto: Presupuesto;

  @Index()
  @Column()
  presupuestoId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'ordenId' })
  orden: Order;

  @Index()
  @Column()
  ordenId: number;

  @Column({ type: 'int', default: 1 })
  versionPresupuesto: number;

  @Column({
    type: 'enum',
    enum: DecisionPresupuesto,
    default: DecisionPresupuesto.APROBADO,
  })
  decision: DecisionPresupuesto;

  @Column({
    type: 'enum',
    enum: ModalidadAutorizacion,
    default: ModalidadAutorizacion.TOKEN_ODS_PRIVADO,
  })
  modalidad: ModalidadAutorizacion;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  montoAprobado: number;

  @Column({ type: 'jsonb', nullable: true })
  alcanceResumen: any; // Snapshot exacto de ítems, repuestos y mano de obra aceptados

  @Column({ type: 'varchar', length: 150 })
  autorizanteNombre: string;

  @Column({ type: 'varchar', length: 20 })
  autorizanteIdentificacion: string;

  @Column({ type: 'varchar', length: 50, default: 'TITULAR' })
  autorizanteParentesco: string;

  @ManyToOne(() => DocumentoOrden, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'documentoOrdenId' })
  documentoOrden: DocumentoOrden | null;

  @Column({ nullable: true })
  documentoOrdenId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registradoPorId' })
  registradoPor: User | null;

  @Column({ nullable: true })
  registradoPorId: number | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  ipOrigen: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 64 })
  hashIntegridad: string; // SHA-256 de los datos de la autorización

  @CreateDateColumn({ type: 'timestamp' })
  fechaAutorizacion: Date;
}
