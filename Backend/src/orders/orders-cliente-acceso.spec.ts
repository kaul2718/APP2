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
});
