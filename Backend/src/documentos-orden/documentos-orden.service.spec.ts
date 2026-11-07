import * as QRCode from 'qrcode';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentosOrdenService } from './documentos-orden.service';
import { DocumentoOrden, TipoDocumentoOrden } from './entities/documento-orden.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { FirmaElectronicaService } from '../firma-electronica/firma-electronica.service';
import { ConfiguracionSistemaService } from '../configuracion-sistema/configuracion-sistema.service';

describe('DocumentosOrdenService - Generación de PDF y Word-Wrap', () => {
  let service: DocumentosOrdenService;

  const mockDocumentoRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockOrderRepo = {
    findOne: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn().mockResolvedValue('key-pdf-123'),
    getPresignedUrl: jest.fn().mockResolvedValue('https://storage.example.com/pdf-123'),
    getFileBuffer: jest.fn().mockRejectedValue(new Error('No logo buffer')),
  };

  const mockFirmaElectronicaService = {
    getConfig: jest.fn().mockResolvedValue(null),
  };

  const mockConfiguracionSistemaService = {
    obtenerConfiguracion: jest.fn().mockResolvedValue({
      nombreComercial: 'Hospital del Computador',
      terminosRecepcion: '1. RESPALDO DE INFORMACIÓN: Hospital no se responsabiliza.\\n2. CLÁUSULA DE ABANDONO: Tras 60 días.\\n3. DIAGNÓSTICO: Presuntivo.',
      terminosEntrega: 'Garantía de 90 días contra defectos de servicio.',
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentosOrdenService,
        {
          provide: getRepositoryToken(DocumentoOrden),
          useValue: mockDocumentoRepo,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: FirmaElectronicaService,
          useValue: mockFirmaElectronicaService,
        },
        {
          provide: ConfiguracionSistemaService,
          useValue: mockConfiguracionSistemaService,
        },
      ],
    }).compile();

    service = module.get<DocumentosOrdenService>(DocumentosOrdenService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('generarPdfCanonico - Adaptación dinámica de Problema Reportado', () => {
    const ordenBase: any = {
      id: 3,
      workOrderNumber: '00003',
      createdAt: new Date('2026-11-07'),
      client: {
        nombre: 'GEOVANY',
        apellido: 'SALAZAR',
        cedula: '0103644480',
        telefono: '0969492150',
      },
      equipo: {
        tipoEquipo: { nombre: 'Laptop' },
        marca: { nombre: 'Lenovo' },
        modelo: { nombre: 'G40-70' },
        numeroSerie: 'YB04121593',
      },
      accesorios: ['Cargador original', 'Mouse inalámbrico'],
      checklistData: {
        version: 2,
        tipoOrden: 'COMPLETA',
        inspeccionRecepcion: {
          estadoEncendido: 'correcto',
          fisica: [
            { item: 'Carcasa', estado: 'bueno' },
            { item: 'Pantalla', estado: 'bueno' },
            { item: 'Teclado', estado: 'bueno' },
            { item: 'Puertos', estado: 'bueno' },
          ],
          funcional: [
            { item: 'Encendido', estado: 'funciona' },
            { item: 'Video', estado: 'funciona' },
            { item: 'Audio', estado: 'falla', observaciones: 'Micrófono no responde' },
            { item: 'WiFi', estado: 'funciona' },
          ],
        },
      },
    };

    const operador: any = { id: 1, nombre: 'Admin', email: 'admin@hdc.ec' };

    it('debe generar PDF de Recepción exitosamente con texto largo continuo (sin desborde)', async () => {
      const ordenLarga = {
        ...ordenBase,
        problemaReportado:
          'MICROFONO DEJÓ DE FUNCIONAR, SOLO EN APLICACION ZOOM TIENE AUDIO, NO PERMITE INSTALAR APLICACIONES EXTERNAS POR FALTA DE ESPACIO EN DISCO PRINCIPAL',
      };

      const dto: any = {
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        firmanteNombre: 'GEOVANY SALAZAR',
        firmanteIdentificacion: '0103644480',
      };

      const pdfBytes = await (service as any).generarPdfCanonico(
        ordenLarga,
        dto,
        operador,
        null,
      );

      expect(pdfBytes).toBeDefined();
      expect(pdfBytes.length).toBeGreaterThan(1000);
      // Validar cabecera mágica de PDF
      const header = Buffer.from(pdfBytes.slice(0, 4)).toString();
      expect(header).toBe('%PDF');
    });

    it('debe generar PDF de Recepción exitosamente con saltos de línea manuales (sin colisión vertical)', async () => {
      const ordenConSaltos = {
        ...ordenBase,
        problemaReportado:
          'SU ULTIMO USO FUNCIONÓ CORRECTAMENTE UNICAMNETE CON BATERIA,\nAL QUERER ENCENDER Y CARGAR LA LAPTOP YA NO VOLVIÓ A ENCENDER.\nINGRESA PARA REVISIÓN TÉCNICA URGENTE',
      };

      const dto: any = {
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        firmanteNombre: 'GEOVANY SALAZAR',
        firmanteIdentificacion: '0103644480',
      };

      const pdfBytes = await (service as any).generarPdfCanonico(
        ordenConSaltos,
        dto,
        operador,
        null,
      );

      expect(pdfBytes).toBeDefined();
      const header = Buffer.from(pdfBytes.slice(0, 4)).toString();
      expect(header).toBe('%PDF');
    });

    it('debe generar PDF de Entrega exitosamente con presupuesto y actividades', async () => {
      const ordenEntrega = {
        ...ordenBase,
        problemaReportado: 'Equipo reparado satisfactoriamente.',
        actividades: [
          {
            fecha: new Date(),
            tipoActividad: { nombre: 'Mantenimiento' },
            trabajoRealizado: 'Limpieza física, cambio de pasta térmica y formateo de sistema.',
          },
        ],
        presupuesto: {
          version: 1,
          detallesPresupuestoItems: [
            {
              parte: { nombre: 'Mantenimiento preventivo general' },
              cantidad: 1,
              precioUnitario: 25.0,
              subtotal: 25.0,
            },
          ],
        },
      };

      const dto: any = {
        tipoDocumento: TipoDocumentoOrden.ENTREGA,
        firmanteNombre: 'GEOVANY SALAZAR',
        firmanteIdentificacion: '0103644480',
      };

      const pdfBytes = await (service as any).generarPdfCanonico(
        ordenEntrega,
        dto,
        operador,
        null,
      );

      expect(pdfBytes).toBeDefined();
      const header = Buffer.from(pdfBytes.slice(0, 4)).toString();
      expect(header).toBe('%PDF');
    });

  describe('Código QR en Comprobante PDF según Estado de Cuenta', () => {
    const ordenBase: any = {
      id: 7,
      workOrderNumber: '00007',
      createdAt: new Date('2026-11-07'),
      client: {
        id: 77,
        nombre: 'GEOVANY',
        apellido: 'SALAZAR',
        cedula: '0103644480',
        telefono: '0969492150',
      },
      equipo: {
        tipoEquipo: { nombre: 'Laptop' },
        marca: { nombre: 'Lenovo' },
        modelo: { nombre: 'G40-70' },
        numeroSerie: 'SN777777',
      },
      estadoOrden: { nombre: 'Recepción' },
      problemaReportado: 'Problema de prueba para comprobante',
    };

    const operador: any = {
      id: 1,
      nombre: 'Recepción',
      apellido: 'HDC',
    };

    it('debe generar QR a /activar-cuenta con token de 48h si el cliente está pendiente de activación', async () => {
      // Cliente sin contraseña
      mockUserRepo.findOne.mockResolvedValueOnce({
        id: 77,
        password: null,
      });

      const qrSpy = jest.spyOn(QRCode, 'toBuffer');

      const dto: any = {
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        firmanteNombre: 'GEOVANY SALAZAR',
        firmanteIdentificacion: '0103644480',
        tokenActivacion: 'token_activacion_valido_12345678',
      };

      const pdfBytes = await (service as any).generarPdfCanonico(
        ordenBase,
        dto,
        operador,
        null,
      );

      expect(pdfBytes).toBeDefined();
      expect(qrSpy).toHaveBeenCalled();
      const lastCallUrl = qrSpy.mock.calls[qrSpy.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain('/activar-cuenta?token=token_activacion_valido_12345678');
    });

    it('debe generar QR a /signin si el cliente ya tiene cuenta activada con contraseña', async () => {
      // Cliente con contraseña
      mockUserRepo.findOne.mockResolvedValueOnce({
        id: 77,
        password: '$2a$10$hashed_password_exists',
      });

      const qrSpy = jest.spyOn(QRCode, 'toBuffer');

      const dto: any = {
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        firmanteNombre: 'GEOVANY SALAZAR',
        firmanteIdentificacion: '0103644480',
        tokenActivacion: 'token_que_no_debe_usarse',
      };

      const pdfBytes = await (service as any).generarPdfCanonico(
        ordenBase,
        dto,
        operador,
        null,
      );

      expect(pdfBytes).toBeDefined();
      const lastCallUrl = qrSpy.mock.calls[qrSpy.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain('/signin');
      expect(lastCallUrl).not.toContain('token_que_no_debe_usarse');
    });

    it('debe generar QR a /signin en reimpresión de comprobante histórico si no hay token efímero activo', async () => {
      // Cliente sin contraseña pero en reimpresión histórica sin token activo
      mockUserRepo.findOne.mockResolvedValueOnce({
        id: 77,
        password: null,
      });

      const qrSpy = jest.spyOn(QRCode, 'toBuffer');

      const dto: any = {
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        firmanteNombre: 'GEOVANY SALAZAR',
        firmanteIdentificacion: '0103644480',
      };

      const pdfBytes = await (service as any).generarPdfCanonico(
        ordenBase,
        dto,
        operador,
        null,
      );

      expect(pdfBytes).toBeDefined();
      const lastCallUrl = qrSpy.mock.calls[qrSpy.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain('/signin');
      expect(lastCallUrl).not.toContain('/activar-cuenta');
    });
  });
  });
});

