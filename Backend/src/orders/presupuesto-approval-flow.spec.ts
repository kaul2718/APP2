import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderService } from './orders.service';
import {
  DecisionPresupuesto,
  ModalidadAutorizacion,
} from '../presupuesto/entities/autorizacion-presupuesto.entity';
import { validateOrderTransition } from './helpers/order-transition.helper';

describe('Simplificación del Flujo de Aprobación de Presupuestos (Fase 6 - 12 Validaciones)', () => {
  let orderService: OrderService;
  let savedAutorizaciones: any[];
  let savedHistorial: any[];
  let registrarFirmaCalls: any[];
  let updatePresupuestoCalls: any[];
  let currentBudgetStateName: string;

  const mockUsers: Record<number, any> = {
    1: {
      id: 1,
      nombre: 'Carlos',
      apellido: 'Admin',
      cedula: '1700000001',
      userRoles: [{ rol: { slug: 'admin', nombre: 'Administrador' } }],
    },
    2: {
      id: 2,
      nombre: 'María',
      apellido: 'Recepción',
      cedula: '1700000002',
      userRoles: [{ rol: { slug: 'recep', nombre: 'Recepcionista' } }],
    },
    3: {
      id: 3,
      nombre: 'Pedro',
      apellido: 'Técnico',
      cedula: '1700000003',
      userRoles: [{ rol: { slug: 'tech', nombre: 'Técnico' } }],
    },
    4: {
      id: 4,
      nombre: 'Luis',
      apellido: 'Cliente',
      cedula: '1700000004',
      userRoles: [{ rol: { slug: 'client', nombre: 'Cliente' } }],
    },
  };

  beforeEach(() => {
    savedAutorizaciones = [];
    savedHistorial = [];
    registrarFirmaCalls = [];
    updatePresupuestoCalls = [];
    currentBudgetStateName = 'Pendiente';

    const mockOrderRepository: any = {
      findOne: jest.fn().mockImplementation(async ({ where }: any) => ({
        id: where.id || 100,
        workOrderNumber: '00100',
        estado: true,
        deletedAt: null,
        estadoOrdenId: 2,
        estadoOrden: { id: 2, nombre: 'Diagnóstico' },
        client: {
          id: 50,
          nombre: 'Juan',
          apellido: 'Pérez',
          cedula: '0501234567',
        },
        presupuesto: {
          id: 200,
          version: 1,
          estado: { id: 1, nombre: currentBudgetStateName },
          detallesPresupuestoItems: [
            {
              id: 1,
              parteId: 10,
              parte: { nombre: 'Pantalla FHD' },
              cantidad: 1,
              precioUnitario: 85,
              subtotal: 85,
              estado: true,
              deletedAt: null,
            },
          ],
        },
      })),
    };

    const mockUserRepository: any = {
      findOne: jest.fn().mockImplementation(async ({ where }: any) => mockUsers[where.id] || null),
    };

    const mockAutorizacionRepository: any = {
      findOne: jest.fn().mockImplementation(async ({ where }: any) => {
        return (
          savedAutorizaciones.find(
            (a) =>
              a.presupuestoId === where.presupuestoId &&
              a.versionPresupuesto === where.versionPresupuesto,
          ) || null
        );
      }),
      create: jest.fn().mockImplementation((data) => ({ id: savedAutorizaciones.length + 1, ...data })),
      save: jest.fn().mockImplementation(async (entity) => {
        savedAutorizaciones.push(entity);
        return entity;
      }),
    };

    const mockPresupuestoRepository: any = {
      manager: {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockImplementation(async ({ where }: any) => {
            if (where.nombre === 'Aprobado') return { id: 2, nombre: 'Aprobado' };
            if (where.nombre === 'Rechazado') return { id: 3, nombre: 'Rechazado' };
            return { id: 1, nombre: 'Pendiente' };
          }),
        }),
      },
    };

    const mockHistorialRepository: any = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation(async (data) => {
        savedHistorial.push(data);
        return data;
      }),
    };

    const mockPresupuestoService: any = {
      update: jest.fn().mockImplementation(async (id, dto, operadorId) => {
        updatePresupuestoCalls.push({ id, dto, operadorId });
        currentBudgetStateName = dto.estadoId === 2 ? 'Aprobado' : 'Rechazado';
        return { id, estadoId: dto.estadoId };
      }),
    };

    const mockDocumentosOrdenService: any = {
      registrarFirma: jest.fn().mockImplementation(async (orderId, payload, operadorId) => {
        registrarFirmaCalls.push({ orderId, payload, operadorId });
        return { id: 999 };
      }),
    };

    orderService = new OrderService(
      mockOrderRepository,
      mockUserRepository,
      {} as any, // equipoRepository
      {} as any, // estadoOrdenRepository
      {} as any, // actividadTecnicaRepository
      mockPresupuestoRepository,
      mockAutorizacionRepository,
      {} as any, // casilleroRepository
      {} as any, // evidenciaTecnicaRepository
      mockHistorialRepository,
      {} as any, // documentoRepository
      {} as any, // notificacionService
      {} as any, // storageService
      mockPresupuestoService,
      {} as any, // configuracionSistemaService
      mockDocumentosOrdenService,
    );
  });

  it('1. Administrador puede aprobar presupuesto sin firma', async () => {
    const res = await orderService.handlePresupuestoActionPresencial(
      100,
      {
        decision: 'APROBADO',
        modalidad: ModalidadAutorizacion.CONFIRMACION_TELEFONICA,
        observaciones: 'Aprobado vía telefónica por administrador',
      },
      1, // Admin
    );

    expect(res.success).toBe(true);
    expect(res.decision).toBe(DecisionPresupuesto.APROBADO);
    expect(res.documentoOrdenId).toBeNull();
    expect(registrarFirmaCalls).toHaveLength(0);
    expect(savedAutorizaciones).toHaveLength(1);
    expect(savedAutorizaciones[0].registradoPorId).toBe(1);
  });

  it('2. Recepcionista puede aprobar presupuesto sin firma', async () => {
    const res = await orderService.handlePresupuestoActionPresencial(
      100,
      {
        decision: 'APROBADO',
        modalidad: ModalidadAutorizacion.CONFIRMACION_MENSAJE_CORREO,
        observaciones: 'Cliente confirmó por WhatsApp de recepción',
      },
      2, // Recepcionista
    );

    expect(res.success).toBe(true);
    expect(res.decision).toBe(DecisionPresupuesto.APROBADO);
    expect(res.modalidad).toBe(ModalidadAutorizacion.CONFIRMACION_MENSAJE_CORREO);
    expect(res.documentoOrdenId).toBeNull();
    expect(savedAutorizaciones[0].registradoPorId).toBe(2);
  });

  it('3. Técnico autorizado puede aprobar presupuesto sin firma', async () => {
    const res = await orderService.handlePresupuestoActionPresencial(
      100,
      {
        decision: 'APROBADO',
        modalidad: ModalidadAutorizacion.CONFIRMACION_TELEFONICA,
        observaciones: 'Cliente confirmó durante llamada con laboratorio',
      },
      3, // Técnico
    );

    expect(res.success).toBe(true);
    expect(res.decision).toBe(DecisionPresupuesto.APROBADO);
    expect(savedAutorizaciones[0].registradoPorId).toBe(3);
  });

  it('4. La firma presencial sigue funcionando cuando se selecciona PRESENCIAL_FIRMA', async () => {
    const res = await orderService.handlePresupuestoActionPresencial(
      100,
      {
        decision: 'APROBADO',
        modalidad: ModalidadAutorizacion.PRESENCIAL_FIRMA,
        autorizanteNombre: 'Juan Pérez',
        autorizanteIdentificacion: '0501234567',
        firmaBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ',
        observaciones: 'Firma en mostrador',
      },
      2,
    );

    expect(res.success).toBe(true);
    expect(res.modalidad).toBe(ModalidadAutorizacion.PRESENCIAL_FIRMA);
    expect(res.documentoOrdenId).toBe(999);
    expect(registrarFirmaCalls).toHaveLength(1);
  });

  it('5. La confirmación telefónica no exige firma manuscrita', async () => {
    const res = await orderService.handlePresupuestoActionPresencial(
      100,
      {
        decision: 'APROBADO',
        modalidad: ModalidadAutorizacion.CONFIRMACION_TELEFONICA,
      },
      2,
    );

    expect(res.success).toBe(true);
    expect(res.documentoOrdenId).toBeNull();
    expect(registrarFirmaCalls).toHaveLength(0);
  });

  it('6. La autorización interna se diferencia claramente y NUNCA registra aceptación del cliente', async () => {
    await orderService.handlePresupuestoActionPresencial(
      100,
      {
        decision: 'APROBADO',
        modalidad: ModalidadAutorizacion.AUTORIZACION_INTERNA,
        autorizanteNombre: 'Juan Pérez', // Incluso si enviaran el nombre del cliente, el backend no lo atribuye al cliente
        observaciones: 'Garantía interna autorizada por taller',
      },
      2, // María Recepción
    );

    expect(savedAutorizaciones).toHaveLength(1);
    const aut = savedAutorizaciones[0];
    expect(aut.modalidad).toBe(ModalidadAutorizacion.AUTORIZACION_INTERNA);
    expect(aut.autorizanteParentesco).toBe('INTERNO_ESTABLECIMIENTO');
    expect(aut.autorizanteNombre).toContain('Autorización Interna (María Recepción)');
    expect(aut.autorizanteNombre).not.toContain('Juan Pérez');
    expect(aut.autorizanteIdentificacion).toBe('1700000002');
  });

  it('7. El rechazo funciona correctamente sin exigir firma', async () => {
    const res = await orderService.handlePresupuestoActionPresencial(
      100,
      {
        decision: 'RECHAZADO',
        modalidad: ModalidadAutorizacion.CONFIRMACION_TELEFONICA,
        observaciones: 'Cliente indica que no desea reparar por costo',
      },
      2,
    );

    expect(res.success).toBe(true);
    expect(res.decision).toBe(DecisionPresupuesto.RECHAZADO);
    expect(updatePresupuestoCalls[0].dto.estadoId).toBe(3); // Rechazado
    expect(savedAutorizaciones[0].decision).toBe(DecisionPresupuesto.RECHAZADO);
  });

  it('8. Las acciones quedan registradas con trazabilidad completa en AutorizacionPresupuesto e HistorialEstadoOrden', async () => {
    await orderService.handlePresupuestoActionPresencial(
      100,
      {
        decision: 'APROBADO',
        modalidad: ModalidadAutorizacion.CONFIRMACION_MENSAJE_CORREO,
        observaciones: 'Correo recibido a las 10:15',
      },
      3,
      '192.168.1.25',
      'JestTestAgent',
    );

    expect(savedAutorizaciones).toHaveLength(1);
    expect(savedAutorizaciones[0]).toMatchObject({
      presupuestoId: 200,
      ordenId: 100,
      registradoPorId: 3,
      decision: DecisionPresupuesto.APROBADO,
      modalidad: ModalidadAutorizacion.CONFIRMACION_MENSAJE_CORREO,
      observaciones: 'Correo recibido a las 10:15',
      ipOrigen: '192.168.1.25',
    });
    expect(savedAutorizaciones[0].fechaAutorizacion).toBeInstanceOf(Date);

    expect(savedHistorial).toHaveLength(1);
    expect(savedHistorial[0].observaciones).toContain('Confirmación por mensaje o correo');
    expect(savedHistorial[0].observaciones).toContain('Correo recibido a las 10:15');
  });

  it('9. Los usuarios sin permisos no pueden aprobar ni rechazar presupuestos', async () => {
    await expect(
      orderService.handlePresupuestoActionPresencial(
        100,
        {
          decision: 'APROBADO',
          modalidad: ModalidadAutorizacion.CONFIRMACION_TELEFONICA,
        },
        4, // Rol client
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('10. La ODS puede avanzar a En Servicio cuando el presupuesto está aprobado sin firma, y se bloquea si está Rechazado', async () => {
    await orderService.handlePresupuestoActionPresencial(
      100,
      {
        decision: 'APROBADO',
        modalidad: ModalidadAutorizacion.CONFIRMACION_TELEFONICA,
      },
      2,
    );

    const ordenAprobada: any = {
      id: 100,
      estadoOrden: { nombre: 'Diagnóstico' },
      actividades: [{ id: 1 }],
      presupuesto: {
        id: 200,
        estado: { nombre: currentBudgetStateName }, // 'Aprobado'
      },
    };

    expect(() =>
      validateOrderTransition({
        estadoActual: { id: 2, nombre: 'Diagnóstico' } as any,
        nuevoEstado: { id: 3, nombre: 'En Servicio' } as any,
        usuario: mockUsers[3] as any, // Técnico autorizado
        orden: ordenAprobada,
      }),
    ).not.toThrow();

    const ordenRechazada: any = {
      ...ordenAprobada,
      presupuesto: {
        id: 200,
        estado: { nombre: 'Rechazado' },
      },
    };

    expect(() =>
      validateOrderTransition({
        estadoActual: { id: 2, nombre: 'Diagnóstico' } as any,
        nuevoEstado: { id: 3, nombre: 'En Servicio' } as any,
        usuario: mockUsers[3] as any, // Técnico autorizado
        orden: ordenRechazada,
      }),
    ).toThrow(BadRequestException);
  });

  it('11 y 12. Se evitan aprobaciones duplicadas y no se alteran decisiones o firmas anteriores', async () => {
    await orderService.handlePresupuestoActionPresencial(
      100,
      {
        decision: 'APROBADO',
        modalidad: ModalidadAutorizacion.PRESENCIAL_FIRMA,
        autorizanteNombre: 'Juan Pérez',
        autorizanteIdentificacion: '0501234567',
        firmaBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ',
      },
      1,
    );

    const decisionOriginal = { ...savedAutorizaciones[0] };

    await expect(
      orderService.handlePresupuestoActionPresencial(
        100,
        {
          decision: 'RECHAZADO',
          modalidad: ModalidadAutorizacion.AUTORIZACION_INTERNA,
        },
        1,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(savedAutorizaciones).toHaveLength(1);
    expect(savedAutorizaciones[0]).toEqual(decisionOriginal);
  });
});
