import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderService } from './orders.service';
import { EstadoOrden } from '../estado-orden/entities/estado-orden.entity';
import { User } from '../users/entities/user.entity';
import { Order } from './entities/order.entity';
import { EstadoOrdenEnum } from '../common/enums/order-status.enum';
import { OrderType } from '../common/enums/order-type.enum';

describe('OrderService - Validaciones de Transición y Flujo Definitivo de 5 Estados ODS', () => {
  let orderService: OrderService;
  let mockOrderRepository: any;
  let mockUserRepository: any;
  let mockEstadoOrdenRepository: any;
  let mockCasilleroRepository: any;
  let mockHistorialRepository: any;
  let mockDocumentoRepository: any;
  let mockNotificacionService: any;

  // Catálogo definitivo de los 5 estados con IDs no correlativos
  const estados: Record<string, EstadoOrden> = {
    recepcion: { id: 10, nombre: EstadoOrdenEnum.RECEPCION, estado: true } as EstadoOrden,
    diagnostico: { id: 25, nombre: EstadoOrdenEnum.DIAGNOSTICO, estado: true } as EstadoOrden,
    en_servicio: { id: 38, nombre: EstadoOrdenEnum.EN_SERVICIO, estado: true } as EstadoOrden,
    listo_para_entrega: { id: 42, nombre: EstadoOrdenEnum.LISTO_PARA_ENTREGA, estado: true } as EstadoOrden,
    entregado: { id: 55, nombre: EstadoOrdenEnum.ENTREGADO, estado: true } as EstadoOrden,
  };

  const regularTechUser: User = {
    id: 2,
    nombre: 'Técnico HDC',
    userRoles: [{ rol: { slug: 'tech' } }],
  } as unknown as User;

  const recepUser: User = {
    id: 3,
    nombre: 'Recepcionista HDC',
    userRoles: [{ rol: { slug: 'recep' } }],
  } as unknown as User;

  const adminUser: User = {
    id: 1,
    nombre: 'Administrador HDC',
    userRoles: [{ rol: { slug: 'admin' } }],
  } as unknown as User;

  beforeEach(() => {
    const qbMock = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockOrderRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((order) => Promise.resolve(order)),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };

    mockUserRepository = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 1) return Promise.resolve(adminUser);
        if (where.id === 2) return Promise.resolve(regularTechUser);
        if (where.id === 3) return Promise.resolve(recepUser);
        return Promise.resolve(null);
      }),
      findOneBy: jest.fn().mockImplementation(({ id }) => {
        if (id === 1) return Promise.resolve(adminUser);
        if (id === 2) return Promise.resolve(regularTechUser);
        if (id === 3) return Promise.resolve(recepUser);
        return Promise.resolve(null);
      }),
    };

    mockEstadoOrdenRepository = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        const id = where?.id;
        const found = Object.values(estados).find((e) => e.id === id);
        return Promise.resolve(found || null);
      }),
      findOneBy: jest.fn().mockImplementation(({ id }) => {
        const found = Object.values(estados).find((e) => e.id === id);
        return Promise.resolve(found || null);
      }),
    };

    mockCasilleroRepository = {
      findOneBy: jest.fn().mockResolvedValue({ id: 101, situacion: 'OCUPADO' }),
      save: jest.fn().mockResolvedValue({}),
    };

    mockHistorialRepository = {
      save: jest.fn().mockResolvedValue({}),
    };

    mockDocumentoRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    mockNotificacionService = {
      notificarCambioEstadoOds: jest.fn().mockResolvedValue(undefined),
    };

    orderService = new (OrderService as any)(
      mockOrderRepository,
      mockUserRepository,
      {} as any,
      mockEstadoOrdenRepository,
      {} as any,
      {} as any,
      {} as any,
      mockCasilleroRepository,
      {} as any,
      mockHistorialRepository,
      mockDocumentoRepository,
      mockNotificacionService,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  describe('1. Flujo habitual de Orden Completa y Express', () => {
    it('1 & 2. Permite transición Recepción -> Diagnóstico en orden completa', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.recepcion, estados.diagnostico, regularTechUser);
      }).not.toThrow();
    });

    it('3. Permite transición directa Recepción -> En Servicio en órdenes Express (omitiendo Diagnóstico)', () => {
      const ordenExpress: any = {
        id: 1,
        tipoOrden: OrderType.EXPRESS,
        esperaRepuesto: false,
      };
      expect(() => {
        orderService.validarTransicionEstado(estados.recepcion, estados.en_servicio, regularTechUser, ordenExpress);
      }).not.toThrow();
    });

    it('4. Permite transición Diagnóstico -> En Servicio cuando el presupuesto está resuelto', () => {
      const ordenConPresupuestoAprobado: any = {
        id: 2,
        presupuesto: { id: 10, estado: { nombre: 'Aprobado' } },
        esperaRepuesto: false,
      };
      expect(() => {
        orderService.validarTransicionEstado(
          estados.diagnostico,
          estados.en_servicio,
          regularTechUser,
          ordenConPresupuestoAprobado,
        );
      }).not.toThrow();
    });

    it('5. Permite transición En Servicio -> Listo para Entrega si no hay repuestos pendientes y checklist OK', () => {
      const ordenLista: any = {
        id: 3,
        esperaRepuesto: false,
        checklistData: {
          results: [
            { item: 'Encendido', estado: 'ok', requerido: true },
            { item: 'Pantalla', estado: 'ok', requerido: true },
          ],
        },
      };
      expect(() => {
        orderService.validarTransicionEstado(
          estados.en_servicio,
          estados.listo_para_entrega,
          regularTechUser,
          ordenLista,
        );
      }).not.toThrow();
    });

    it('6. Permite transición Listo para Entrega -> Entregado al realizar la entrega física en mostrador', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.listo_para_entrega, estados.entregado, recepUser);
      }).not.toThrow();
    });
  });

  describe('2. Transiciones Inválidas y Restricciones por Rol', () => {
    it('7. Rechaza saltos arbitrarios inválidos como Recepción -> Entregado por parte de un técnico sin motivo de mostrador', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.recepcion, estados.entregado, regularTechUser);
      }).toThrow(ForbiddenException);
    });

    it('8. Restricción por rol: recepcionista no puede mover una orden a En Servicio', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.diagnostico, estados.en_servicio, recepUser);
      }).toThrow(ForbiddenException);
    });

    it('8b. El administrador tiene facultad de rectificación y anulación administrativa', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.entregado, estados.listo_para_entrega, adminUser);
      }).not.toThrow();
    });

    it('Una orden en Entregado no puede ser alterada por técnicos o recepcionistas', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.entregado, estados.en_servicio, regularTechUser);
      }).toThrow(ForbiddenException);
    });
  });

  describe('3. Reglas de Presupuesto, Repuestos y Checklist de Calidad', () => {
    it('9. Bloquea avance a En Servicio si el presupuesto está en estado Pendiente de aprobación', () => {
      const ordenConPresupuestoPendiente: any = {
        id: 4,
        presupuesto: { id: 11, estado: { nombre: 'Pendiente' } },
      };
      expect(() => {
        orderService.validarTransicionEstado(
          estados.diagnostico,
          estados.en_servicio,
          regularTechUser,
          ordenConPresupuestoPendiente,
        );
      }).toThrow(BadRequestException);
    });

    it('10. Permite resolver presupuesto rechazado enviando Diagnóstico -> Listo para Entrega (devolución)', () => {
      const ordenPresupuestoRechazado: any = {
        id: 5,
        presupuesto: { id: 12, estado: { nombre: 'Rechazado' } },
        esperaRepuesto: false,
      };
      expect(() => {
        orderService.validarTransicionEstado(
          estados.diagnostico,
          estados.listo_para_entrega,
          regularTechUser,
          ordenPresupuestoRechazado,
          'Presupuesto rechazado por el cliente, devolución sin reparación',
        );
      }).not.toThrow();
    });

    it('11. Bloquea avance En Servicio -> Listo para Entrega si la orden tiene esperaRepuesto = true', () => {
      const ordenEsperandoRepuesto: any = {
        id: 6,
        esperaRepuesto: true,
      };
      expect(() => {
        orderService.validarTransicionEstado(
          estados.en_servicio,
          estados.listo_para_entrega,
          regularTechUser,
          ordenEsperandoRepuesto,
        );
      }).toThrow('espera de repuesto');
    });

    it('12. Bloquea avance En Servicio -> Listo para Entrega si hay verificaciones técnicas requeridas pendientes en el checklist', () => {
      const ordenChecklistIncompleto: any = {
        id: 7,
        esperaRepuesto: false,
        checklistData: {
          results: [
            { item: 'Prueba de Carga', estado: 'pendiente', requerido: true },
          ],
        },
      };
      expect(() => {
        orderService.validarTransicionEstado(
          estados.en_servicio,
          estados.listo_para_entrega,
          regularTechUser,
          ordenChecklistIncompleto,
        );
      }).toThrow('Control de calidad no superado');
    });
  });

  describe('4. Casos Especiales, Cancelaciones y Reprocesos Técnicos', () => {
    it('13. Diagnóstico sin reparación posterior avanza directamente a Listo para Entrega', () => {
      expect(() => {
        orderService.validarTransicionEstado(
          estados.diagnostico,
          estados.listo_para_entrega,
          regularTechUser,
          null,
          'Solo diagnóstico solicitado por el cliente',
        );
      }).not.toThrow();
    });

    it('14. Devolución o cancelación directa en mostrador de recepción requiere justificación obligatoria', () => {
      // Sin motivo debe rechazar
      expect(() => {
        orderService.validarTransicionEstado(
          estados.recepcion,
          estados.entregado,
          recepUser,
          null,
        );
      }).toThrow('debe ingresar obligatoriamente un motivo');

      // Motivo insuficiente (menos de 5 chars) debe rechazar
      expect(() => {
        orderService.validarTransicionEstado(
          estados.recepcion,
          estados.entregado,
          recepUser,
          null,
          'no',
        );
      }).toThrow('debe ingresar obligatoriamente un motivo');

      // Con justificación válida se autoriza la devolución directa
      expect(() => {
        orderService.validarTransicionEstado(
          estados.recepcion,
          estados.entregado,
          recepUser,
          null,
          'Cliente retira el equipo por urgencia antes de la revisión técnica',
        );
      }).not.toThrow();
    });

    it('Reproceso técnico legítimo: permite regresar de Listo para Entrega a En Servicio con motivo', () => {
      expect(() => {
        orderService.validarTransicionEstado(
          estados.listo_para_entrega,
          estados.en_servicio,
          regularTechUser,
          null,
          'Ajuste detectado en prueba con cliente',
        );
      }).not.toThrow();
    });

    it('Re-evaluación técnica: permite regresar de En Servicio a Diagnóstico', () => {
      expect(() => {
        orderService.validarTransicionEstado(
          estados.en_servicio,
          estados.diagnostico,
          regularTechUser,
          null,
          'Falla oculta detectada durante la intervención',
        );
      }).not.toThrow();
    });
  });

  describe('5. Portal Público y Mapeo Canónico de los 5 Estados', () => {
    const cincoEstados = [
      { nombre: 'Recepción', step: 1, frase: 'recibido e ingresado al sistema' },
      { nombre: 'Diagnóstico', step: 2, frase: 'evaluación y diagnóstico' },
      { nombre: 'En Servicio', step: 3, frase: 'personal técnico especializado' },
      { nombre: 'Listo para Entrega', step: 4, frase: 'listo para ser retirado' },
      { nombre: 'Entregado', step: 5, frase: 'Servicio técnico finalizado y equipo entregado' },
    ];

    cincoEstados.forEach(({ nombre, step, frase }) => {
      it(`debe mapear el estado canónico "${nombre}" al paso ${step} con su mensaje respectivo`, () => {
        expect(orderService.calcularStepPublico(nombre)).toBe(step);
        expect(orderService.obtenerMensajePublicoEstado(nombre)).toContain(frase);
      });
    });

    it('debe informar contexto de espera de repuesto en el mensaje público de En Servicio', () => {
      const ordenEspera = { esperaRepuesto: true };
      const mensaje = orderService.obtenerMensajePublicoEstado('En Servicio', ordenEspera);
      expect(mensaje).toContain('espera del arribo de repuestos');
    });

    it('debe informar presupuesto pendiente de aprobación en el mensaje público de Diagnóstico', () => {
      const ordenPresupuesto = { presupuesto: { estado: { nombre: 'Pendiente' } } };
      const mensaje = orderService.obtenerMensajePublicoEstado('Diagnóstico', ordenPresupuesto);
      expect(mensaje).toContain('pendiente de aprobación');
    });
  });
});
