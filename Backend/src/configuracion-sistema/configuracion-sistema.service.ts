import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ConfiguracionSistema } from './entities/configuracion-sistema.entity';
import { UpdateConfiguracionSistemaDto } from './dto/update-configuracion-sistema.dto';
import { Order } from '../orders/entities/order.entity';
import { StorageService } from '../storage/storage.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConfiguracionSistemaService {
  private readonly logger = new Logger(ConfiguracionSistemaService.name);

  constructor(
    @InjectRepository(ConfiguracionSistema)
    private readonly configRepo: Repository<ConfiguracionSistema>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
  ) { }

  /**
   * Obtiene la configuración del sistema (Singleton id: 1).
   * Si no existe, inicializa automáticamente los valores por defecto basándose
   * en el historial de órdenes existentes para no romper la correlatividad.
   */
  async obtenerConfiguracion(): Promise<ConfiguracionSistema> {
    let config = await this.configRepo.findOne({ where: { id: 1 } });

    if (!config) {
      this.logger.log('Inicializando configuración del sistema por primera vez...');
      config = await this.inicializarConfiguracionPorDefecto();
    }

    // Resolver URL pública o firmada del logo si existe
    if (config.storageKeyLogo) {
      try {
        config.logoUrl = await this.storageService.getPresignedUrl(
          config.storageKeyLogo,
          86400, // 24 horas
        );
      } catch (err) {
        this.logger.warn(`No se pudo generar URL para el logo: ${err.message}`);
      }
    }

    return config;
  }

  /**
   * Inicializa la fila única de configuración, calculando el siguiente número
   * a partir del máximo workOrderNumber presente en la base de datos.
   */
  private async inicializarConfiguracionPorDefecto(): Promise<ConfiguracionSistema> {
    const maxNumeroDetectado = await this.obtenerMaximoNumeroOrdenExistente();
    const siguienteNumero = maxNumeroDetectado > 0 ? maxNumeroDetectado + 1 : 1;

    const nuevaConfig = this.configRepo.create({
      id: 1,
      ordenPrefijo: '',
      ordenSiguienteNumero: siguienteNumero,
      ordenDigitos: 5,
      ordenPermitirReinicio: false,
      presupuestoPrefijo: 'PRE-',
      presupuestoSiguienteNumero: 1,
      presupuestoDigitos: 5,
      nombreEmpresa: 'Hospital del Computador',
      nombreComercial: 'Hospital del Computador',
      ruc: '1792999999001',
      telefono: '022123456',
      whatsapp: '+593 96 962 0222',
      correoContacto: 'soporte@hospitaldelcomputador.com',
      direccion: 'Quito, Pichincha, Ecuador',
      ciudad: 'Quito',
      slogan: 'Servicio Técnico Especializado en Computación, Laptops y Servidores',
      porcentajeIva: 15.0,
      diasAbandono: 60,
      diasGarantiaDefault: 90,
      diasVigenciaPresupuesto: 15,
      tiempoLimiteDiagnosticoHoras: 48,
      diasAlertaControlRetiro: 15,
      stockMinimoAlertaGlobal: 5,
    });

    return await this.configRepo.save(nuevaConfig);
  }

  /**
   * Encuentra el mayor número correlativo numérico en las órdenes existentes
   */
  async obtenerMaximoNumeroOrdenExistente(): Promise<number> {
    try {
      const ordenes = await this.orderRepo.find({
        select: ['workOrderNumber'],
        withDeleted: true,
      });

      let maxNum = 0;
      for (const ord of ordenes) {
        if (ord.workOrderNumber) {
          const soloDigitos = ord.workOrderNumber.replace(/\D/g, '');
          if (soloDigitos) {
            const num = parseInt(soloDigitos, 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      }
      return maxNum;
    } catch (err) {
      this.logger.error('Error calculando máximo número de orden:', err.message);
      return 0;
    }
  }

  /**
   * Actualiza la configuración del sistema.
   * Valida que no se reduzca el correlativo por debajo del máximo emitido,
   * a menos que se especifique ordenPermitirReinicio = true o se cambie de prefijo.
   */
  async actualizarConfiguracion(
    dto: UpdateConfiguracionSistemaDto,
  ): Promise<ConfiguracionSistema> {
    const config = await this.obtenerConfiguracion();

    // Validar si el usuario intenta modificar el siguiente número de orden
    if (
      dto.ordenSiguienteNumero !== undefined &&
      dto.ordenSiguienteNumero !== config.ordenSiguienteNumero
    ) {
      const maxExistente = await this.obtenerMaximoNumeroOrdenExistente();

      // Si el prefijo no cambia y el número deseado es <= al máximo existente
      const prefijoActual = config.ordenPrefijo || '';
      const nuevoPrefijo =
        dto.ordenPrefijo !== undefined ? dto.ordenPrefijo : prefijoActual;

      if (
        prefijoActual === nuevoPrefijo &&
        dto.ordenSiguienteNumero <= maxExistente &&
        !dto.ordenPermitirReinicio
      ) {
        throw new BadRequestException(
          `No se puede establecer el siguiente número en ${dto.ordenSiguienteNumero} porque ya existen órdenes con numeración hasta ${maxExistente}. Active 'Permitir reinicio o modificación especial' si está seguro.`,
        );
      }
    }

    // Aplicar cambios excluyendo metadatos de solo lectura
    const { id, logoUrl, storageKeyLogo, createdAt, updatedAt, ...cambios } = dto as any;
    Object.assign(config, cambios);

    // Asegurar que porcentajeIva sea número
    if (dto.porcentajeIva !== undefined) {
      config.porcentajeIva = Number(dto.porcentajeIva);
    }

    const guardada = await this.configRepo.save(config);
    this.logger.log('✓ Configuración del sistema actualizada correctamente.');
    return this.obtenerConfiguracion();
  }

  /**
   * Genera el siguiente número de orden de forma estrictamente ATÓMICA
   * utilizando bloqueo transaccional (Pessimistic Write Lock).
   * Evita duplicados ante múltiples recepcionistas creando órdenes concurrentemente.
   */
  async generarSiguienteNumeroOrden(externalManager?: EntityManager): Promise<string> {
    const executeWithManager = async (manager: EntityManager): Promise<string> => {
      // 1. Obtener fila con bloqueo pesimista
      let config = await manager.findOne(ConfiguracionSistema, {
        where: { id: 1 },
        lock: { mode: 'pessimistic_write' },
      });

      if (!config) {
        config = await this.inicializarConfiguracionPorDefecto();
      }

      // 2. Extraer número actual
      const numeroActual = config.ordenSiguienteNumero;
      const prefijo = config.ordenPrefijo || '';
      const digitos = config.ordenDigitos || 5;

      // 3. Formatear con ceros a la izquierda
      const numeroFormateado = `${prefijo}${String(numeroActual).padStart(digitos, '0')}`;

      // 4. Incrementar correlativo y persistir
      config.ordenSiguienteNumero = numeroActual + 1;
      await manager.save(config);

      this.logger.log(
        `✓ Secuencial ODS generado con éxito: [${numeroFormateado}]. Siguiente correlativo: ${config.ordenSiguienteNumero}`,
      );

      return numeroFormateado;
    };

    if (externalManager) {
      return await executeWithManager(externalManager);
    }

    return await this.dataSource.transaction(async (txManager) => {
      return await executeWithManager(txManager);
    });
  }

  /**
   * Genera una vista previa del formato de orden según los parámetros suministrados
   */
  obtenerVistaPrevia(prefijo = '', numero = 1, digitos = 5): string {
    const cleanPrefix = prefijo || '';
    const cleanNum = numero > 0 ? numero : 1;
    const cleanDigits = Math.max(3, Math.min(10, digitos || 5));
    return `${cleanPrefix}${String(cleanNum).padStart(cleanDigits, '0')}`;
  }

  /**
   * Sube o reemplaza el logo oficial de la empresa a Cloudflare R2
   */
  async subirLogo(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<{ logoUrl: string }> {
    const config = await this.obtenerConfiguracion();

    const uuid = uuidv4();
    const extension = mimeType.includes('svg')
      ? 'svg'
      : mimeType.includes('png')
        ? 'png'
        : mimeType.includes('webp')
          ? 'webp'
          : 'jpg';
    const storageKey = `configuracion/logo_empresa_${uuid}.${extension}`;

    // Subir a StorageService
    await this.storageService.uploadFile(storageKey, fileBuffer, mimeType, {
      tipo: 'logo_empresa',
    });

    config.storageKeyLogo = storageKey;
    await this.configRepo.save(config);

    const logoUrl = await this.storageService.getPresignedUrl(storageKey, 86400);
    config.logoUrl = logoUrl;

    return { logoUrl };
  }

  /**
   * Obtiene exclusivamente los datos públicos de identidad, contacto,
   * horarios y ubicación para la Landing Page pública.
   */
  async obtenerConfiguracionPublica() {
    const config = await this.obtenerConfiguracion();
    return {
      nombreEmpresa: config.nombreEmpresa || 'Hospital del Computador',
      nombreComercial: config.nombreComercial || 'Hospital del Computador',
      slogan: config.slogan || 'Servicio Técnico Especializado en Computación, Laptops y Servidores',
      telefono: config.telefono || '022123456',
      whatsapp: config.whatsapp || '0969620222',
      correoContacto: config.correoContacto || 'soporte@hospitaldelcomputador.com',
      direccion: config.direccion || 'Riobamba, Chimborazo, Ecuador',
      ciudad: config.ciudad || 'Riobamba',
      logoUrl: config.logoUrl || null,
      diasGarantiaDefault: config.diasGarantiaDefault || 90,
      tiempoLimiteDiagnosticoHoras: config.tiempoLimiteDiagnosticoHoras || 48,
      ruc: config.ruc || '',
      ordenPrefijo: config.ordenPrefijo || '',
      ordenDigitos: config.ordenDigitos || 5,
      coordenadas: {
        lat: -1.666199,
        lng: -78.6550158,
        googleMapsUrl: 'https://maps.app.goo.gl/zpips5vrKuky1DjC9',
      },
      horarios: {
        lunesViernes: 'Lunes a Viernes: 8:00 AM - 6:30 PM',
        sabados: 'Sábados: 9:00 AM - 2:00 PM',
        domingos: 'Domingos: Cerrado',
      },
    };
  }
}
