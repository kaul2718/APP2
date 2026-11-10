import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrderService } from './orders.service';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { EstadoOrden } from '../estado-orden/entities/estado-orden.entity';
import { ActividadTecnica } from '../actividad-tecnica/entities/actividad-tecnica.entity';
import { Presupuesto } from '../presupuesto/entities/presupuesto.entity';
import { AutorizacionPresupuesto, ModalidadAutorizacion, DecisionPresupuesto } from '../presupuesto/entities/autorizacion-presupuesto.entity';
import { Casillero } from '../casillero/entities/casillero.entity';
import { EvidenciaTecnica } from '../evidencia-tecnica/entities/evidencia-tecnica.entity';
import { HistorialEstadoOrden } from '../historial-estado-orden/entities/historial-estado-orden.entity';
import { DocumentoOrden } from '../documentos-orden/entities/documento-orden.entity';
import { NotificacionService } from '../notificacion/notificacion.service';
import { StorageService } from '../storage/storage.service';
import { PresupuestoService } from '../presupuesto/presupuesto.service';
import { ConfiguracionSistemaService } from '../configuracion-sistema/configuracion-sistema.service';
import { DocumentosOrdenService } from '../documentos-orden/documentos-orden.service';
import { ActivacionService } from '../auth/activacion.service';
import { OrderController } from './orders.controller';
import { UsersService } from '../users/users.service';
import { RolService } from '../rol/rol.service';
import { extractClientIp, normalizeIp, isPrivateOrLoopbackIp } from '../common/helpers/client-ip.helper';

describe('Acceso de Clientes - Flujo Unificado por Cédula, Aislamiento y Presupuestos', () => {
  let orderService: OrderService;
  let orderController: OrderController;

  const mockOrderQb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    setLock: jest.fn().mockReturnThis(),
  };

  const mockOrderRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockOrderQb),
    manager: {
      transaction: jest.fn(),
    },
  };

  const ordenMockDb: any = {
    id: 28,
    workOrderNumber: '00028',
    createdAt: new Date('2026-11-07T14:30:00Z'),
    updatedAt: new Date('2026-11-07T16:00:00Z'),
    estado: true,
    client: {
      id: 77,
      nombre: 'DIGDINA ANGELICA',
      apellido: 'TORRES CALVOPIÑ',
      cedula: '0501465587',
      telefono: '0959081140',
      correo: 'digdina@example.com',
    },
    equipo: {
      tipoEquipo: { nombre: 'Laptop' },
      marca: { nombre: 'Dell' },
      modelo: { nombre: 'Latitude 5420' },
      numeroSerie: 'GNTCQ8W8X3',
    },
    estadoOrden: { id: 2, nombre: 'Diagnóstico' },
    historialEstados: [
      { id: 1, fechaCambio: new Date('2026-11-07T16:00:00Z'), estadoOrden: { nombre: 'Diagnóstico' } },
      { id: 2, fechaCambio: new Date('2026-11-07T14:30:00Z'), estadoOrden: { nombre: 'Recepción' } },
    ],
    presupuesto: {
      id: 10,
      total: 120,
      detallesPresupuestoItems: [{ parte: { nombre: 'Teclado' }, cantidad: 1, precioUnitario: 45 }],
    },
    evidencias: [
      { id: 1, storageKey: 'evidencias/test.jpg', archivoUrl: 'https://r2.secret.url/test.jpg' },
    ],
    problemaReportado: 'Detalle técnico confidencial de falla',
    conclusionesRecomendaciones: 'Recomendación interna del taller',
    tokenAcceso: 'ODS-SECRET-TOKEN-DO-NOT-EXPOSE',
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    findBy: jest.fn(),
  };

  const mockEquipoRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 1, numeroSerie: 'SN12345', estado: true }),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 1, numeroSerie: 'SN12345', estado: true }),
    }),
  };

  const mockEstadoOrdenRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 1, nombre: 'Recepción' }),
    findOneBy: jest.fn().mockResolvedValue({ id: 1, nombre: 'Recepción' }),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 1, nombre: 'Recepción' }),
    }),
  };

  const mockActivacionService = {
    generarTokenActivacion: jest.fn(),
    validarTokenActivacion: jest.fn(),
    consumirTokenActivacion: jest.fn(),
  };

  const mockPresupuestoService = {
    update: jest.fn(),
  };

  const mockAutorizacionRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Equipo), useValue: mockEquipoRepo },
        { provide: getRepositoryToken(EstadoOrden), useValue: mockEstadoOrdenRepo },
        { provide: getRepositoryToken(ActividadTecnica), useValue: { create: jest.fn(), save: jest.fn() } },
        { provide: getRepositoryToken(Presupuesto), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(AutorizacionPresupuesto), useValue: mockAutorizacionRepo },
        { provide: getRepositoryToken(Casillero), useValue: {} },
        { provide: getRepositoryToken(EvidenciaTecnica), useValue: {} },
        { provide: getRepositoryToken(HistorialEstadoOrden), useValue: { create: jest.fn(), save: jest.fn() } },
        { provide: getRepositoryToken(DocumentoOrden), useValue: {} },
        { provide: NotificacionService, useValue: { notificarAsignacionTecnico: jest.fn(), notificarCambioEstadoOds: jest.fn() } },
        { provide: StorageService, useValue: {} },
        { provide: PresupuestoService, useValue: mockPresupuestoService },
        { provide: ConfiguracionSistemaService, useValue: { generarSiguienteNumeroOrden: jest.fn().mockResolvedValue('00010') } },
        { provide: DocumentosOrdenService, useValue: {} },
        { provide: ActivacionService, useValue: mockActivacionService },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: UsersService, useValue: { findOne: jest.fn() } },
        { provide: RolService, useValue: { findAll: jest.fn(), findBySlug: jest.fn() } },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
    orderController = module.get<OrderController>(OrderController);
  });

  describe('1. Registro de orden y emisión de invitación segura', () => {
    it('debe generar automáticamente credencial de activación de 48h si el cliente no tiene contraseña', async () => {
      const clientSinClave = {
        id: 20,
        nombre: 'Carlos',
        apellido: 'Andrade',
        cedula: '1712345678',
        password: null, // Cuenta no activada
        estado: true,
      };

      // Mock validaciones
      mockUserRepo.findOne
        .mockResolvedValueOnce(clientSinClave) // validateUser(client)
        .mockResolvedValueOnce({ id: 1, estado: true }) // validateUser(recepcionista)
        .mockResolvedValueOnce({ id: 20, password: null, nombre: 'Carlos', apellido: 'Andrade', cedula: '1712345678' }); // select password

      mockOrderRepo.create.mockImplementation((ent) => ({ id: 5, workOrderNumber: '00010', ...ent }));
      mockOrderRepo.save.mockImplementation((ent) => Promise.resolve(ent));

      mockActivacionService.generarTokenActivacion.mockResolvedValue({
        success: true,
        token: 'token_secreto_48h_123456789012',
        qrUrl: 'http://localhost:4000/activar-cuenta?token=token_secreto_48h_123456789012',
        qrDataUrl: 'data:image/png;base64,...',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });

      const res: any = await orderService.create({
        clientId: 20,
        equipoId: 1,
        problemaReportado: 'No enciende la pantalla',
        recepcionistaId: 1,
      } as any);

      expect(res.cuentaPendiente).toBe(true);
      expect(res.activacion).toBeDefined();
      expect(res.activacion.token).toBe('token_secreto_48h_123456789012');
      expect(mockActivacionService.generarTokenActivacion).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioId: 20 }),
        1,
      );
    });

    it('NO debe generar invitación de activación si el cliente ya tiene cuenta activada con contraseña', async () => {
      const clientConClave = {
        id: 20,
        nombre: 'Carlos',
        apellido: 'Andrade',
        cedula: '1712345678',
        password: '$2a$10$hashed_password_exists', // Ya activado
        estado: true,
      };

      mockUserRepo.findOne
        .mockResolvedValueOnce(clientConClave)
        .mockResolvedValueOnce({ id: 1, estado: true })
        .mockResolvedValueOnce({ id: 20, password: '$2a$10$hashed_password_exists' });

      mockOrderRepo.create.mockImplementation((ent) => ({ id: 6, workOrderNumber: '00011', ...ent }));
      mockOrderRepo.save.mockImplementation((ent) => Promise.resolve(ent));

      const res: any = await orderService.create({
        clientId: 20,
        equipoId: 1,
        problemaReportado: 'Mantenimiento preventivo',
        recepcionistaId: 1,
      } as any);

      expect(res.cuentaPendiente).toBe(false);
      expect(res.activacion).toBeNull();
      expect(mockActivacionService.generarTokenActivacion).not.toHaveBeenCalled();
    });
  });

  describe('2. Aislamiento de órdenes entre clientes (Tenant Security)', () => {
    it('debe impedir que un cliente consulte órdenes de otro cliente manipulando el ID en findOne', async () => {
      const ordenDeOtroCliente: any = {
        id: 100,
        workOrderNumber: '00100',
        estado: true,
        client: { id: 99, cedula: '0999999999' }, // Pertenece al cliente 99
      };

      mockOrderRepo.findOne.mockResolvedValue(ordenDeOtroCliente);

      // Usuario autenticado es el cliente con ID 50
      const usuarioClienteAutenticado = {
        id: 50,
        sub: 50,
        role: 'client',
      };

      await expect(
        orderController.findOne('100', 'false', usuarioClienteAutenticado),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir que un cliente consulte su propia orden', async () => {
      const miOrden: any = {
        id: 101,
        workOrderNumber: '00101',
        estado: true,
        client: { id: 50, cedula: '1712345678' },
      };

      mockOrderRepo.findOne.mockResolvedValue(miOrden);

      const usuarioClienteAutenticado = {
        id: 50,
        sub: 50,
        role: 'client',
      };

      const res = await orderController.findOne('101', 'false', usuarioClienteAutenticado);
      expect(res.id).toBe(101);
    });
  });

  describe('3. Respuesta autenticada de presupuestos desde el portal del cliente', () => {
    it('debe rechazar intento de responder presupuesto si la orden no pertenece al cliente autenticado', async () => {
      const ordenDeOtro: any = {
        id: 200,
        estado: true,
        client: { id: 99, cedula: '0999999999' },
        presupuesto: { id: 1, estado: { nombre: 'Pendiente' } },
      };

      mockOrderRepo.findOne.mockResolvedValue(ordenDeOtro);

      await expect(
        orderService.handleClientPresupuestoAction(200, 50, { action: 'ACEPTADO' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe autorizar presupuesto con PORTAL_CLIENTE_AUTENTICADO y hash SHA-256 cuando el cliente es el dueño', async () => {
      const miOrdenConPresupuesto: any = {
        id: 201,
        workOrderNumber: '00201',
        estado: true,
        client: { id: 50, cedula: '1712345678', nombre: 'Carlos', apellido: 'Andrade' },
        presupuesto: {
          id: 15,
          version: 1,
          estado: { nombre: 'Pendiente' },
          detallesPresupuestoItems: [
            { parteId: 1, parte: { nombre: 'Pantalla 15.6 LED' }, cantidad: 1, precioUnitario: 85 },
          ],
        },
      };

      mockOrderRepo.findOne.mockResolvedValue(miOrdenConPresupuesto);

      const mockQueryBuilder = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(miOrdenConPresupuesto),
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          create: jest.fn().mockImplementation((ent, data) => data),
          save: jest.fn().mockImplementation((ent, data) => Promise.resolve(data)),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
          getRepository: jest.fn().mockReturnValue({
            findOne: jest.fn().mockResolvedValue({ id: 2, nombre: 'Aprobado' }),
          }),
        };
        return await cb(mockManager);
      });

      const res = await orderService.handleClientPresupuestoAction(201, 50, { action: 'ACEPTADO' });

      expect(res.success).toBe(true);
      expect(res.hashIntegridad).toBeDefined();
      expect(res.hashIntegridad.length).toBe(64); // SHA-256 hex
      expect(res.data.decision).toBe('ACEPTADO');
    });
  });

  describe('4. Consulta pública simplificada de orden de servicio (sin clave privada)', () => {
    it('debe retornar resumen público no sensible cuando cédula y número de orden coinciden', async () => {
      const qbMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(ordenMockDb),
      };
      mockOrderRepo.createQueryBuilder.mockReturnValue(qbMock);

      const res = await orderService.findPublicOrder('0501465587', '00028', undefined, '192.168.1.10');

      expect(res).toBeDefined();
      expect(res.workOrderNumber).toBe('#00028');
      expect(res.tipoEquipo).toBe('Laptop');
      expect(res.marcaModelo).toBe('Dell Latitude 5420');
      expect(res.estadoActual).toBe('Diagnóstico');
      expect(res.estadoStep).toBe(2);
      expect(res.fechaRecepcion).toBeDefined();
      expect(res.fechaUltimaActualizacion).toBeDefined();
      expect(res.mensajeEstado).toContain('laboratorio');

      // Verificación estricta: NINGÚN dato sensible o privado debe existir en la respuesta
      expect((res as any).cliente).toBeUndefined();
      expect((res as any).cedula).toBeUndefined();
      expect((res as any).nombre).toBeUndefined();
      expect((res as any).telefono).toBeUndefined();
      expect((res as any).correo).toBeUndefined();
      expect((res as any).numeroSerie).toBeUndefined();
      expect((res as any).presupuesto).toBeUndefined();
      expect((res as any).total).toBeUndefined();
      expect((res as any).evidencias).toBeUndefined();
      expect((res as any).archivoUrl).toBeUndefined();
      expect((res as any).problemaReportado).toBeUndefined();
      expect((res as any).historial).toBeUndefined();
      expect((res as any).tokenAcceso).toBeUndefined();
      expect((res as any).tokenAccesoHash).toBeUndefined();
    });

    it('debe normalizar número de orden con ceros iniciales, formato numeral o prefijo ODS', async () => {
      let capturedVariants: string[] = [];
      const qbMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockImplementation((clause: string, params: any) => {
          if (params?.orderVariants) {
            capturedVariants = params.orderVariants;
          }
          return qbMock;
        }),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(ordenMockDb),
      };
      mockOrderRepo.createQueryBuilder.mockReturnValue(qbMock);

      await orderService.findPublicOrder('0501465587', '28', undefined, '192.168.1.11');

      expect(capturedVariants).toContain('28');
      expect(capturedVariants).toContain('00028');
      expect(capturedVariants).toContain('#00028');
      expect(capturedVariants).toContain('ODS-00028');
    });

    it('debe normalizar cédula eliminando guiones y espacios', async () => {
      let capturedCedula = '';
      const qbMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockImplementation((clause: string, params: any) => {
          if (params?.cleanCedula) {
            capturedCedula = params.cleanCedula;
          }
          return qbMock;
        }),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(ordenMockDb),
      };
      mockOrderRepo.createQueryBuilder.mockReturnValue(qbMock);

      await orderService.findPublicOrder(' 050-1465-587 ', '00028', undefined, '192.168.1.12');

      expect(capturedCedula).toBe('0501465587');
    });

    it('debe rechazar formatos inválidos de cédula con BadRequestException', async () => {
      await expect(
        orderService.findPublicOrder('123', '00028', undefined, '192.168.1.13'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        orderService.findPublicOrder('cedula-con-caracteres-invalidos!', '00028', undefined, '192.168.1.13'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe retornar respuesta uniforme NotFoundException cuando la cédula no coincide con la orden', async () => {
      const qbMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null), // No coincide
      };
      mockOrderRepo.createQueryBuilder.mockReturnValue(qbMock);

      await expect(
        orderService.findPublicOrder('1712345678', '00028', undefined, '192.168.1.14'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe retornar la misma respuesta uniforme NotFoundException cuando la orden no existe', async () => {
      const qbMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockOrderRepo.createQueryBuilder.mockReturnValue(qbMock);

      await expect(
        orderService.findPublicOrder('0501465587', '99999', undefined, '192.168.1.15'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe aplicar rate limiting y bloquear con 429 tras exceso de solicitudes repetidas por IP', async () => {
      const qbMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(ordenMockDb),
      };
      mockOrderRepo.createQueryBuilder.mockReturnValue(qbMock);

      const targetIp = '203.0.113.88';
      // Hacemos 25 consultas permitidas
      for (let i = 0; i < 25; i++) {
        await orderService.findPublicOrder('0501465587', '00028', undefined, targetIp);
      }

      // La consulta 26 debe ser rechazada con TOO_MANY_REQUESTS (429)
      await expect(
        orderService.findPublicOrder('0501465587', '00028', undefined, targetIp),
      ).rejects.toThrow('Demasiadas solicitudes de consulta');
    });
  });

  describe('5. Seguridad de Rate Limiting, Extracción de IP y Mitigación de IP Spoofing (Caddy Proxy)', () => {
    it('debe extraer X-Real-IP autoritativo fijado por Caddy e ignorar cabeceras X-Forwarded-For falsificadas por el cliente', () => {
      // Simula conexión TCP interna desde Caddy (red de contenedores Docker o localhost)
      const mockReqFromCaddy = {
        socket: { remoteAddress: '172.18.0.3' }, // IP interna del contenedor Caddy
        headers: {
          'x-real-ip': '203.0.113.50', // IP real del cliente establecida autoritativamente por Caddy
          'x-forwarded-for': '1.2.3.4, 5.6.7.8', // Cabecera manipulada que el atacante intentó inyectar
        },
      };

      const ip = extractClientIp(mockReqFromCaddy);
      expect(ip).toBe('203.0.113.50');
      expect(ip).not.toBe('1.2.3.4');
    });

    it('debe rechazar cabeceras X-Real-IP y X-Forwarded-For cuando la conexión TCP directa proviene de una IP pública no confiable (bypassing proxy)', () => {
      // Simula un atacante intentando conectarse directamente al puerto del backend sin pasar por Caddy
      const mockUntrustedReq = {
        socket: { remoteAddress: '198.51.100.22' }, // IP pública directa del atacante
        headers: {
          'x-real-ip': '8.8.8.8',
          'x-forwarded-for': '1.1.1.1',
        },
      };

      const ip = extractClientIp(mockUntrustedReq);
      // Debe ignorar completamente las cabeceras arbitrarias del atacante y usar la IP del socket real
      expect(ip).toBe('198.51.100.22');
      expect(ip).not.toBe('8.8.8.8');
      expect(ip).not.toBe('1.1.1.1');
    });

    it('debe normalizar direcciones IPv6 mapeadas a IPv4 (::ffff:x.x.x.x)', () => {
      const mockReq = {
        socket: { remoteAddress: '::ffff:127.0.0.1' },
        headers: {
          'x-real-ip': '::ffff:203.0.113.99',
        },
      };

      const ip = extractClientIp(mockReq);
      expect(ip).toBe('203.0.113.99');
    });

    it('debe evitar el crecimiento ilimitado de memoria del rate limiter expulsando registros antiguos', () => {
      orderService.limpiarRateLimitConsultasPublicas();

      // Simular inserción masiva de IPs únicas para verificar control de capacidad
      for (let i = 1; i <= 5100; i++) {
        const fakeIp = `10.${Math.floor(i / 65536)}.${Math.floor((i % 65536) / 256)}.${i % 256}`;
        orderService.verificarRateLimitConsultaPublica(fakeIp);
      }

      // La capacidad máxima en memoria está estrictamente acotada a 5000 entradas
      // No debe exceder la capacidad máxima
      expect((orderService as any).rateLimitConsultasPublicas.size).toBeLessThanOrEqual(5000);
    });
  });

  describe('6. Correspondencia Canónica de los 5 Estados del Sistema con el Flujo Público de 5 Etapas', () => {
    const estadosCanonicos = [
      {
        nombre: 'Recepción',
        stepEsperado: 1,
        fraseClave: 'recibido e ingresado al sistema para inspección inicial',
      },
      {
        nombre: 'Diagnóstico',
        stepEsperado: 2,
        fraseClave: 'evaluación y diagnóstico',
      },
      {
        nombre: 'En Servicio',
        stepEsperado: 3,
        fraseClave: 'personal técnico especializado',
      },
      {
        nombre: 'Listo para Entrega',
        stepEsperado: 4,
        fraseClave: 'listo para ser retirado en nuestro centro de atención técnica',
      },
      {
        nombre: 'Entregado',
        stepEsperado: 5,
        fraseClave: 'Servicio técnico finalizado y equipo entregado a entera conformidad',
      },
    ];

    estadosCanonicos.forEach(({ nombre, stepEsperado, fraseClave }) => {
      it(`debe mapear el estado canónico "${nombre}" al paso ${stepEsperado} con su mensaje descriptivo correspondiente`, () => {
        const step = orderService.calcularStepPublico(nombre);
        const mensaje = orderService.obtenerMensajePublicoEstado(nombre);

        expect(step).toBe(stepEsperado);
        expect(mensaje).toContain(fraseClave);
      });
    });

    it('debe mapear variantes ortográficas o sinónimos al estado canónico correspondiente', () => {
      expect(orderService.calcularStepPublico('RECEPCION')).toBe(1);
      expect(orderService.calcularStepPublico('DIAGNOSTICO')).toBe(2);
      expect(orderService.calcularStepPublico('Reparación')).toBe(3);
      expect(orderService.calcularStepPublico('En Servicio')).toBe(3);
      expect(orderService.calcularStepPublico('Listo para Entrega')).toBe(4);
      expect(orderService.calcularStepPublico('Entregado')).toBe(5);
    });

    it('debe informar contextualmente cuando una orden en En Servicio está en espera de repuestos', async () => {
      const qbMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      };
      mockOrderRepo.createQueryBuilder.mockReturnValue(qbMock);

      // Simular orden en estado "En Servicio" con esperaRepuesto = true
      qbMock.getOne.mockResolvedValueOnce({
        ...ordenMockDb,
        estadoOrden: { id: 38, nombre: 'En Servicio' },
        esperaRepuesto: true,
      });
      const res = await orderService.findPublicOrder('0501465587', '00028', undefined, '127.0.0.1');
      expect(res.estadoActual).toBe('En Servicio');
      expect(res.estadoStep).toBe(3);
      expect(res.esperaRepuesto).toBe(true);
      expect(res.mensajeEstado).toContain('espera del arribo de repuestos');
    });

    it('debe informar contextualmente cuando una orden en Diagnóstico tiene presupuesto pendiente de aprobación', async () => {
      const qbMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      };
      mockOrderRepo.createQueryBuilder.mockReturnValue(qbMock);

      // Simular orden en estado "Diagnóstico" con presupuesto pendiente
      qbMock.getOne.mockResolvedValueOnce({
        ...ordenMockDb,
        estadoOrden: { id: 25, nombre: 'Diagnóstico' },
        presupuesto: { id: 10, estado: { nombre: 'Pendiente' } },
      });
      const res = await orderService.findPublicOrder('0501465587', '00028', undefined, '127.0.0.1');
      expect(res.estadoActual).toBe('Diagnóstico');
      expect(res.estadoStep).toBe(2);
      expect(res.mensajeEstado).toContain('pendiente de aprobación');
    });
  });
});
