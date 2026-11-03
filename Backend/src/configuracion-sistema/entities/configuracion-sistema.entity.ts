import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('configuracion_sistema')
export class ConfiguracionSistema {
  @PrimaryGeneratedColumn()
  id: number;

  // ─── 1. Secuenciales de Órdenes ──────────────────────────────────────────
  @Column({ type: 'varchar', length: 20, default: '' })
  ordenPrefijo: string; // Ej: "ODS-", "HDC-", o ""

  @Column({ type: 'integer', default: 1 })
  ordenSiguienteNumero: number; // Próximo número correlativo a emitir

  @Column({ type: 'integer', default: 5 })
  ordenDigitos: number; // Cantidad de dígitos con ceros a la izquierda (ej: 5 -> 00032)

  @Column({ type: 'boolean', default: false })
  ordenPermitirReinicio: boolean;

  // ─── 2. Secuenciales de Presupuestos ────────────────────────────────────
  @Column({ type: 'varchar', length: 20, default: 'PRE-' })
  presupuestoPrefijo: string;

  @Column({ type: 'integer', default: 1 })
  presupuestoSiguienteNumero: number;

  @Column({ type: 'integer', default: 5 })
  presupuestoDigitos: number;

  // ─── 3. Identidad Corporativa y Datos de Contacto ─────────────────────────
  @Column({ type: 'varchar', length: 150, default: 'Hospital del Computador' })
  nombreEmpresa: string;

  @Column({ type: 'varchar', length: 150, default: 'Hospital del Computador' })
  nombreComercial: string;

  @Column({ type: 'varchar', length: 13, default: '1792999999001' })
  ruc: string;

  @Column({ type: 'varchar', length: 20, default: '022123456' })
  telefono: string;

  @Column({ type: 'varchar', length: 25, default: '+593 96 962 0222' })
  whatsapp: string;

  @Column({ type: 'varchar', length: 100, default: 'soporte@elhospitaldelcomputador.com' })
  correoContacto: string;

  @Column({ type: 'text', default: 'Quito, Pichincha, Ecuador' })
  direccion: string;

  @Column({ type: 'varchar', length: 100, default: 'Quito' })
  ciudad: string;

  @Column({
    type: 'varchar',
    length: 200,
    default: 'Servicio Técnico Especializado en Computación, Laptops y Servidores',
  })
  slogan: string;

  @Column({ type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  storageKeyLogo: string | null;

  // ─── 4. Políticas Legales y Términos de Servicio (PDFs) ───────────────────
  @Column({ type: 'integer', default: 60 })
  diasAbandono: number; // Días para declarar equipo en abandono (Código Civil EC)

  @Column({ type: 'integer', default: 90 })
  diasGarantiaDefault: number; // Días de garantía sobre mano de obra técnica

  @Column({
    type: 'text',
    default:
      '1. RESPALDO DE INFORMACIÓN: Hospital del Computador no se responsabiliza por la pérdida de datos o software en discos de almacenamiento.\n2. CLÁUSULA DE ABANDONO: Equipos no retirados tras el plazo reglamentario causarán costos de bodegaje y podrán ser considerados en abandono legal.\n3. DIAGNÓSTICO PRELIMINAR: La recepción inicial es presuntiva sujeta a confirmación en laboratorio.',
  })
  terminosRecepcion: string;

  @Column({
    type: 'text',
    default:
      'El cliente declara haber recibido el equipo a entera satisfacción y conformidad tras la realización del servicio técnico. Toda reparación cuenta con garantía limitada sobre mano de obra técnica contra defectos del servicio prestado. No cubre humedad, golpes, sobrevoltajes ni sellos de seguridad violentados.',
  })
  terminosEntrega: string;

  // ─── 5. Parámetros Económicos y Operativos ────────────────────────────────
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 15.0 })
  porcentajeIva: number; // IVA actual en Ecuador: 15%

  @Column({ type: 'integer', default: 15 })
  diasVigenciaPresupuesto: number;

  @Column({ type: 'integer', default: 48 })
  tiempoLimiteDiagnosticoHoras: number; // Límite para emitir diagnóstico antes de alerta

  @Column({ type: 'integer', default: 15 })
  diasAlertaControlRetiro: number; // Días en estado "Control" antes de alertar retiro pendiente

  @Column({ type: 'integer', default: 5 })
  stockMinimoAlertaGlobal: number;

  // ─── 6. Plantillas para Mensajería (WhatsApp / Correo) ────────────────────
  @Column({
    type: 'text',
    default:
      '¡Hola, {cliente}! Su equipo {equipo} fue ingresado a Hospital del Computador con la Orden #{orden}. Puede seguir el estado en vivo ingresando a: {enlace_consulta}',
  })
  plantillaWhatsappRecepcion: string;

  @Column({
    type: 'text',
    default:
      'Estimado/a {cliente}, le informamos que su equipo {equipo} (Orden #{orden}) ha finalizado su proceso técnico exitosamente y se encuentra listo para retiro en nuestro taller.',
  })
  plantillaWhatsappListoEntrega: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
