import * as fs from 'fs';
import * as QRCode from 'qrcode';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentosOrdenService } from './documentos-orden.service';
import { DocumentoOrden, TipoDocumentoOrden } from './entities/documento-orden.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { ActivacionCuenta } from '../auth/entities/activacion-cuenta.entity';
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

  const mockActivacionRepo = {
    findOne: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn().mockResolvedValue('key-pdf-123'),
    getPresignedUrl: jest.fn().mockResolvedValue('https://storage.example.com/pdf-123'),
    getFileBuffer: jest.fn().mockRejectedValue(new Error('No logo buffer')),
  };

  const mockFirmaElectronicaService = {
    getConfig: jest.fn().mockResolvedValue(null),
    firmarPdfCriptografico: jest.fn().mockImplementation(async (buf) => buf),
  };

  const mockConfiguracionSistemaService = {
    obtenerConfiguracion: jest.fn().mockResolvedValue({
      nombreComercial: 'Hospital del Computador',
      terminosRecepcion:
        '1. RESPALDO DE INFORMACIÓN: Hospital del Computador no se responsabiliza por la pérdida de datos o software en discos de almacenamiento, debiendo el cliente respaldar previamente su información.\n' +
        '2. CLÁUSULA DE ABANDONO: Equipos no retirados tras 60 días contados a partir de la notificación de finalización causarán costos de bodegaje y podrán ser considerados en abandono legal conforme a la ley.\n' +
        '3. DIAGNÓSTICO PRELIMINAR: La recepción inicial es presuntiva y está sujeta a confirmación y diagnóstico definitivo por parte del departamento técnico en laboratorio.',
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
          provide: getRepositoryToken(ActivacionCuenta),
          useValue: mockActivacionRepo,
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
      mockActivacionRepo.findOne.mockResolvedValueOnce({
        id: 1,
        usuarioId: 77,
        usedAt: null,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
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

    it('debe generar QR de cuenta pendiente (sin dirigir engañosamente a /signin) en reimpresión sin token efímero', async () => {
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
      expect(lastCallUrl).toContain('/activar-cuenta');
      expect(lastCallUrl).not.toContain('/signin');
    });

    it('debe descartar un token caducado o revocado y mostrar QR de cuenta pendiente', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({
        id: 77,
        password: null,
      });
      mockActivacionRepo.findOne.mockResolvedValueOnce({
        id: 1,
        usuarioId: 77,
        usedAt: new Date(),
        revokedAt: null,
        expiresAt: new Date(Date.now() - 3600000),
      });

      const qrSpy = jest.spyOn(QRCode, 'toBuffer');
      const dto: any = {
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        firmanteNombre: 'GEOVANY SALAZAR',
        firmanteIdentificacion: '0103644480',
        tokenActivacion: 'token_caducado_123',
      };

      const pdfBytes = await (service as any).generarPdfCanonico(
        ordenBase,
        dto,
        operador,
        null,
      );

      expect(pdfBytes).toBeDefined();
      const lastCallUrl = qrSpy.mock.calls[qrSpy.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain('/activar-cuenta');
      expect(lastCallUrl).not.toContain('token_caducado_123');
    });

    it('debe rechazar un token válido que pertenezca a otro cliente distinto al de la orden', async () => {
      // Orden pertenece a cliente 77
      mockUserRepo.findOne.mockResolvedValueOnce({
        id: 77,
        password: null,
      });
      // En la base de datos se busca con usuarioId: 77, pero el token pertenece a usuario 99 -> no coincide
      mockActivacionRepo.findOne.mockResolvedValueOnce(null);

      const qrSpy = jest.spyOn(QRCode, 'toBuffer');
      const dto: any = {
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        firmanteNombre: 'GEOVANY SALAZAR',
        firmanteIdentificacion: '0103644480',
        tokenActivacion: 'token_de_otro_usuario_9999',
      };

      const pdfBytes = await (service as any).generarPdfCanonico(
        ordenBase,
        dto,
        operador,
        null,
      );

      expect(pdfBytes).toBeDefined();
      const lastCallUrl = qrSpy.mock.calls[qrSpy.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain('/activar-cuenta');
      expect(lastCallUrl).not.toContain('token_de_otro_usuario_9999');
    });

    it('debe retornar el PDF firmado de R2 sin alterarlo si ya existe firmado', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(ordenBase);
      mockDocumentoRepo.findOne.mockResolvedValueOnce({
        id: 10,
        ordenId: 1,
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        storageKeyPdf: 'ordenes/ODS-00001/documentos/acta_recepcion_firmada.pdf',
        estadoFirma: 'FIRMADO',
      });

      const pdfR2Mock = Buffer.from('%PDF-1.4 mock R2 signed pdf content');
      mockStorageService.getFileBuffer.mockResolvedValueOnce(pdfR2Mock);

      const result = await service.obtenerPdfBuffer(1, TipoDocumentoOrden.RECEPCION, 1, 'token_que_debe_ignorarse');
      expect(result).toEqual(pdfR2Mock);
      expect(mockStorageService.getFileBuffer).toHaveBeenCalledWith('ordenes/ODS-00001/documentos/acta_recepcion_firmada.pdf');
    });

    it('debe impedir sobrescribir un documento de recepción que ya fue firmado y sellado', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(ordenBase);
      mockUserRepo.findOne.mockResolvedValueOnce(operador);
      mockDocumentoRepo.findOne.mockResolvedValueOnce({
        id: 10,
        ordenId: 1,
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        storageKeyPdf: 'ordenes/ODS-00001/documentos/acta_recepcion_firmada.pdf',
        estadoFirma: 'FIRMADO',
      });

      const dto: any = {
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        firmanteNombre: 'GEOVANY SALAZAR',
        firmanteIdentificacion: '0103644480',
        firmaBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      await expect(service.registrarFirma(1, dto, 1)).rejects.toThrow('ya fue firmada y sellada previamente');
    });

    it('debe registrar firma del cliente exitosamente', async () => {
      mockOrderRepo.findOne.mockResolvedValueOnce(ordenBase);
      mockUserRepo.findOne.mockResolvedValueOnce(operador);
      mockDocumentoRepo.findOne.mockResolvedValueOnce(null);
      mockDocumentoRepo.create.mockImplementation((d) => d);
      mockDocumentoRepo.save.mockImplementation(async (d) => ({ id: 1, ...d }));

      const dto: any = {
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        firmanteNombre: 'DIGDINA ANGELICA TORRES CALVOPIÑ',
        firmanteIdentificacion: '0501465587',
        firmaBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      const result = await service.registrarFirma(1, dto, 1);
      expect(result).toBeDefined();
    });

    it('debe generar y exportar muestra física del comprobante rediseñado para inspección visual', async () => {
      mockFirmaElectronicaService.getConfig.mockResolvedValueOnce({
        activo: true,
        titularNombre: 'ANGEL PAUL OBREGON MAYORGA',
        titularCedulaRuc: '0601927122',
        entidadEmisora: 'SECURITY DATA S.A. / BANCO CENTRAL DEL ECUADOR',
      });
      mockUserRepo.findOne.mockResolvedValueOnce({
        id: 77,
        password: null, // cuenta pendiente
      });
      mockActivacionRepo.findOne.mockResolvedValueOnce({
        id: 1,
        usuarioId: 77,
        usedAt: null,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
      });

      const ordenMuestra: any = {
        id: 7,
        workOrderNumber: '00007',
        createdAt: new Date('2026-11-07'),
        client: {
          id: 77,
          nombre: 'DIGDINA ANGELICA',
          apellido: 'TORRES CALVOPIÑ',
          cedula: '0501465587',
          telefono: '0959081140',
        },
        equipo: {
          tipoEquipo: { nombre: 'Laptop' },
          marca: { nombre: 'Dell' },
          modelo: { nombre: 'Latitud 5' },
          numeroSerie: 'GNTCQ8W8X3',
        },
        problemaReportado: 'Test de usabilidad y verificación de maquetación limpia.',
        accesorios: ['Cargador original Dell', 'Mouse inalámbrico'],
        checklistData: {
          version: 2,
          tipoOrden: 'RECEPCION',
          inspeccionRecepcion: {
            estadoEncendido: 'correcto',
            fisica: [
              { item: 'Estado Físico General', estado: 'bueno' },
              { item: 'Pantalla', estado: 'bueno' },
            ],
            funcional: [
              { item: 'Encendido / Arranque', estado: 'funciona' },
            ],
          },
        },
      };

      const dto: any = {
        tipoDocumento: TipoDocumentoOrden.RECEPCION,
        firmanteNombre: 'DIGDINA ANGELICA TORRES CALVOPIÑ',
        firmanteIdentificacion: '0501465587',
        tokenActivacion: 'token_prueba_activacion_ods00007',
      };

      const pdfBytes = await (service as any).generarPdfCanonico(
        ordenMuestra,
        dto,
        operador,
        null,
      );

      expect(pdfBytes).toBeDefined();
      const outPath = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\9839a193-e112-4e97-a24c-7bfb67646f41\\sample-reception-00007.pdf';
      fs.writeFileSync(outPath, Buffer.from(pdfBytes));
      expect(fs.existsSync(outPath)).toBe(true);
    });
  });

  describe('Generación de Ticket Térmico POS (80 mm)', () => {
    const ordenBase: any = {
      id: 24,
      workOrderNumber: '00024',
      createdAt: new Date('2026-11-07T15:42:00'),
      client: {
        id: 10,
        nombre: 'Juan',
        apellido: 'Pérez',
        cedula: '0601927122',
        telefono: '0959081140',
      },
      equipo: {
        tipoEquipo: { nombre: 'Laptop' },
        marca: { nombre: 'Dell' },
        modelo: { nombre: 'Latitude' },
        numeroSerie: 'GNTC****23',
      },
      estadoOrden: { nombre: 'Recepción' },
      problemDescription: 'Revisión y mantenimiento general',
    };

    it('debe generar ticket térmico de 80 mm para cliente nuevo con token de activación válido', async () => {
      const qrSpy = jest.spyOn(QRCode, 'toBuffer');
      mockOrderRepo.findOne.mockResolvedValue(ordenBase);
      mockUserRepo.findOne.mockImplementation(async (query: any) => {
        if (query.where?.id === 10) {
          // Cliente pendiente sin contraseña
          return { id: 10, password: null };
        }
        return { id: 1, nombre: 'Operador', apellido: 'Recepción' };
      });

      mockActivacionRepo.findOne.mockResolvedValue({
        id: 1,
        usuarioId: 10,
        tokenHash: 'hash123',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48), // vigente 48h
        usedAt: null,
        revokedAt: null,
      });

      const buffer = await service.obtenerTicketTermicoBuffer(24, 1, 'token-valido-123');
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);

      const lastCallUrl = qrSpy.mock.calls[qrSpy.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain('/activar-cuenta?token=token-valido-123');
      expect(lastCallUrl).not.toContain('/signin');

      // Guardar PDF de muestra para inspección visual
      const outPath = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\9839a193-e112-4e97-a24c-7bfb67646f41\\sample-ticket-00024.pdf';
      fs.writeFileSync(outPath, buffer);
      expect(fs.existsSync(outPath)).toBe(true);
    });

    it('debe generar ticket térmico con enlace /signin cuando el cliente ya tiene contraseña activa', async () => {
      const qrSpy = jest.spyOn(QRCode, 'toBuffer');
      mockOrderRepo.findOne.mockResolvedValue(ordenBase);
      mockUserRepo.findOne.mockImplementation(async (query: any) => {
        if (query.where?.id === 10) {
          // Cliente ya activo con contraseña
          return { id: 10, password: 'hashed-password-123' };
        }
        return { id: 1, nombre: 'Operador', apellido: 'Recepción' };
      });

      const buffer = await service.obtenerTicketTermicoBuffer(24, 1);
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);

      const lastCallUrl = qrSpy.mock.calls[qrSpy.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain('/signin');
      expect(lastCallUrl).not.toContain('/activar-cuenta');
    });

    it('debe generar ticket térmico con enlace seguro /activar-cuenta si la invitación caducó o fue revocada', async () => {
      const qrSpy = jest.spyOn(QRCode, 'toBuffer');
      mockOrderRepo.findOne.mockResolvedValue(ordenBase);
      mockUserRepo.findOne.mockImplementation(async (query: any) => {
        if (query.where?.id === 10) {
          return { id: 10, password: null };
        }
        return { id: 1, nombre: 'Operador', apellido: 'Recepción' };
      });

      mockActivacionRepo.findOne.mockResolvedValue({
        id: 1,
        usuarioId: 10,
        tokenHash: 'hash123',
        expiresAt: new Date(Date.now() - 1000 * 60), // expirado
        usedAt: null,
        revokedAt: null,
      });

      const buffer = await service.obtenerTicketTermicoBuffer(24, 1, 'token-expirado');
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);

      const lastCallUrl = qrSpy.mock.calls[qrSpy.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain('/activar-cuenta');
      expect(lastCallUrl).not.toContain('token-expirado');

      // Guardar PDF de muestra para inspección visual
      const outPath = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\9839a193-e112-4e97-a24c-7bfb67646f41\\sample-ticket-contingencia.pdf';
      fs.writeFileSync(outPath, buffer);
      expect(fs.existsSync(outPath)).toBe(true);
    });

    it('debe rechazar token de otro cliente y generar ticket con QR a /activar-cuenta sin exponer el token ajeno', async () => {
      const qrSpy = jest.spyOn(QRCode, 'toBuffer');
      mockOrderRepo.findOne.mockResolvedValue(ordenBase);
      mockUserRepo.findOne.mockImplementation(async (query: any) => {
        if (query.where?.id === 10) {
          return { id: 10, password: null };
        }
        return { id: 1, nombre: 'Operador', apellido: 'Recepción' };
      });

      // El token pertenece a usuario 999, no al 10
      mockActivacionRepo.findOne.mockResolvedValue(null);

      const buffer = await service.obtenerTicketTermicoBuffer(24, 1, 'token-de-otro-usuario');
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);

      const lastCallUrl = qrSpy.mock.calls[qrSpy.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain('/activar-cuenta');
      expect(lastCallUrl).not.toContain('token-de-otro-usuario');
    });
  });
  });
});

