import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('firma_electronica_config')
export class FirmaElectronicaConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, default: 'gerente.p12' })
  archivoP12Nombre: string;

  // Ruta física del archivo .p12 en el servidor
  @Column({ type: 'text' })
  archivoP12Ruta: string;

  // Contraseña encriptada con AES-256-GCM
  @Column({ type: 'text' })
  passwordEncriptado: string;

  // Metadatos extraídos del certificado X.509
  @Column({ type: 'varchar', length: 255, nullable: true })
  titularNombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  titularCedulaRuc: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  entidadEmisora: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  organizacion: string;

  @Column({ type: 'timestamp', nullable: true })
  fechaEmision: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaExpiracion: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serialNumber: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: true })
  firmarRecepcion: boolean;

  @Column({ type: 'boolean', default: true })
  firmarEntrega: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
