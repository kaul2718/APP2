import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

export enum TipoDocumentoOrden {
  RECEPCION = 'RECEPCION',
  ENTREGA = 'ENTREGA',
  AUTORIZACION_PRESUPUESTO = 'AUTORIZACION_PRESUPUESTO',
  RECHAZO_PRESUPUESTO = 'RECHAZO_PRESUPUESTO',
}

export enum EstadoFirmaDocumento {
  PENDIENTE = 'PENDIENTE',
  FIRMADO = 'FIRMADO',
  RECHAZADO_CLIENTE = 'RECHAZADO_CLIENTE',
  OMITIDO_AUTORIZADO = 'OMITIDO_AUTORIZADO',
}

@Entity('documentos_orden')
export class DocumentoOrden {
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude()
  @ManyToOne(() => Order, (order) => order.documentos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ordenId' })
  orden: Order;

  @Column()
  ordenId: number;

  @Column({
    type: 'enum',
    enum: TipoDocumentoOrden,
  })
  tipoDocumento: TipoDocumentoOrden;

  @Column({ type: 'varchar', length: 500, nullable: true })
  storageKeyPdf: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  storageKeyFirma: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  pdfSha256: string;

  @Column({ type: 'varchar', length: 30, default: 'v1.0' })
  versionTerminos: string;

  @Column({ type: 'boolean', default: true })
  terminosAceptados: boolean;

  @Column({ type: 'varchar', length: 150 })
  firmanteNombre: string;

  @Column({ type: 'varchar', length: 20 })
  firmanteIdentificacion: string;

  @Column({
    type: 'enum',
    enum: EstadoFirmaDocumento,
    default: EstadoFirmaDocumento.FIRMADO,
  })
  estadoFirma: EstadoFirmaDocumento;

  @Column({ type: 'text', nullable: true })
  motivoSinFirma?: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  ipCliente?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'registradoPorId' })
  registradoPor: User;

  @Column()
  registradoPorId: number;

  @CreateDateColumn({ type: 'timestamp' })
  fechaFirma: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  // Campo virtual para retornar la URL prefirmada de lectura sin persistir en BD
  archivoPdfUrl?: string;
  archivoFirmaUrl?: string;
}
