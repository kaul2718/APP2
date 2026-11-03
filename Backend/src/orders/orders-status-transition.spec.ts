import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { OrderService } from './orders.service';
import { EstadoOrden } from '../estado-orden/entities/estado-orden.entity';
import { User } from '../users/entities/user.entity';
import { Order } from './entities/order.entity';

describe('OrderService - Validaciones de Transición de Estados ODS (8 Estados Definitivos)', () => {
  let orderService: OrderService;
  let mockOrderRepository: any;
  let mockUserRepository: any;
  let mockEstadoOrdenRepository: any;
  let mockCasilleroRepository: any;
  let mockHistorialRepository: any;
  let mockDocumentoRepository: any;
  let mockNotificacionService: any;

  // Mock de los 8 estados definitivos con IDs no consecutivos
  const estados: Record<string, EstadoOrden> = {
    recepcion: { id: 1, nombre: 'Recepción', estado: true } as EstadoOrden,
    diagnostico: { id: 2, nombre: 'Diagnóstico', estado: true } as EstadoOrden,
    repuestos: { id: 3, nombre: 'Repuestos', estado: true } as EstadoOrden,
    aprobacion: { id: 4, nombre: 'Aprobación', estado: true } as EstadoOrden,
    reparacion: { id: 5, nombre: 'Reparación', estado: true } as EstadoOrden,
    control: { id: 7, nombre: 'Control', estado: true } as EstadoOrden, // ID 7 (6 eliminado)
    entrega: { id: 9, nombre: 'Entrega', estado: true } as EstadoOrden, // ID 9 (8 eliminado)
    archivados: { id: 10, nombre: 'Archivados', estado: true } as EstadoOrden, // ID 10 (11 eliminado)
  };

  const regularTechUser: User = {
    id: 2,
    nombre: 'Técnico',
    userRoles: [{ rol: { slug: 'tech' } }],
  } as unknown as User;

  const adminUser: User = {
    id: 1,
    nombre: 'Admin',
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
        return Promise.resolve(null);
      }),
      findOneBy: jest.fn().mockImplementation(({ id }) => {
        if (id === 1) return Promise.resolve(adminUser);
        if (id === 2) return Promise.resolve(regularTechUser);
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
      findOneBy: jest.fn().mockResolvedValue(null),
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

    // Instanciar OrderService con mocks
    orderService = new (OrderService as any)(
      mockOrderRepository,
      mockUserRepository,
      {} as any, // equipoRepo
      mockEstadoOrdenRepository,
      {} as any, // actividadTecnicaRepo
      {} as any, // presupuestoRepo
      {} as any, // autorizacionRepo
      mockCasilleroRepository,
      {} as any, // evidenciaRepo
      mockHistorialRepository,
      mockDocumentoRepository,
      mockNotificacionService,
      {} as any, // storageService
      {} as any, // presupuestoService
      {} as any, // configuracionSistemaService
      {} as any, // documentosOrdenService
    );
  });

  describe('1. Avance secuencial normal (8 estados)', () => {
    it('permite avanzar Recepción (ID 1) -> Diagnóstico (ID 2)', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.recepcion, estados.diagnostico, regularTechUser);
      }).not.toThrow();
    });

    it('permite avanzar Diagnóstico (ID 2) -> Repuestos (ID 3)', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.diagnostico, estados.repuestos, regularTechUser);
      }).not.toThrow();
    });

    it('permite avanzar Repuestos (ID 3) -> Aprobación (ID 4)', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.repuestos, estados.aprobacion, regularTechUser);
      }).not.toThrow();
    });

    it('permite avanzar Aprobación (ID 4) -> Reparación (ID 5)', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.aprobacion, estados.reparacion, regularTechUser);
      }).not.toThrow();
    });

    it('permite avanzar Reparación (ID 5) -> Control (ID 7) [Salto no consecutivo]', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.reparacion, estados.control, regularTechUser);
      }).not.toThrow();
    });

    it('permite avanzar Control (ID 7) -> Entrega (ID 9) [Salto no consecutivo]', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.control, estados.entrega, regularTechUser);
      }).not.toThrow();
    });

    it('permite avanzar Entrega (ID 9) -> Archivados (ID 10)', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.entrega, estados.archivados, regularTechUser);
      }).not.toThrow();
    });
  });

  describe('2. Flujos excepcionales permitidos', () => {
    it('permite Diagnóstico -> Aprobación directo cuando no se requieren repuestos', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.diagnostico, estados.aprobacion, regularTechUser);
      }).not.toThrow();
    });

    it('permite Aprobación -> Control directo cuando el presupuesto es rechazado por el cliente', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.aprobacion, estados.control, regularTechUser);
      }).not.toThrow();
    });

    it('permite Aprobación -> Entrega directo en desistimiento/rechazo con retiro inmediato', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.aprobacion, estados.entrega, regularTechUser);
      }).not.toThrow();
    });

    it('permite Reparación -> Repuestos si se detecta una pieza adicional necesaria', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.reparacion, estados.repuestos, regularTechUser);
      }).not.toThrow();
    });
  });

  describe('3. Retrocesos legítimos de control y diagnóstico', () => {
    it('permite Control -> Reparación si las pruebas de calidad no son superadas', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.control, estados.reparacion, regularTechUser);
      }).not.toThrow();
    });

    it('permite Diagnóstico -> Recepción para rectificación de ingreso', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.diagnostico, estados.recepcion, regularTechUser);
      }).not.toThrow();
    });
  });

  describe('4. Saltos indebidos bloqueados (BadRequestException)', () => {
    it('impide saltar de Recepción a Reparación directamente', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.recepcion, estados.reparacion, regularTechUser);
      }).toThrow(BadRequestException);
    });

    it('impide saltar de Recepción a Entrega directamente', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.recepcion, estados.entrega, regularTechUser);
      }).toThrow(BadRequestException);
    });

    it('impide saltar de Diagnóstico a Archivados directamente', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.diagnostico, estados.archivados, regularTechUser);
      }).toThrow(BadRequestException);
    });

    it('impide modificar o retroceder una orden cerrada en Archivados', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.archivados, estados.diagnostico, regularTechUser);
      }).toThrow(BadRequestException);
    });

    it('impide regresión múltiple arbitraria (ej. Entrega -> Recepción)', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.entrega, estados.recepcion, regularTechUser);
      }).toThrow(BadRequestException);
    });
  });

  describe('5. Rechazo estricto de estados fuera del catálogo oficial', () => {
    const estadoInvalidoActual = { id: 99, nombre: 'Estado Arbitrario Inexistente', estado: true } as EstadoOrden;
    const estadoInvalidoDestino = { id: 11, nombre: 'Anulado', estado: true } as EstadoOrden;

    it('rechaza con BadRequestException si el estado actual no pertenece a los 8 oficiales', () => {
      expect(() => {
        orderService.validarTransicionEstado(estadoInvalidoActual, estados.diagnostico, regularTechUser);
      }).toThrow(BadRequestException);
      expect(() => {
        orderService.validarTransicionEstado(estadoInvalidoActual, estados.diagnostico, regularTechUser);
      }).toThrow(/no pertenece al catálogo oficial/i);
    });

    it('rechaza con BadRequestException si el estado destino no pertenece a los 8 oficiales', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.recepcion, estadoInvalidoDestino, regularTechUser);
      }).toThrow(BadRequestException);
      expect(() => {
        orderService.validarTransicionEstado(estados.recepcion, estadoInvalidoDestino, regularTechUser);
      }).toThrow(/no pertenece al catálogo oficial/i);
    });

    it('incluso un Administrador es rechazado si el estado no pertenece a los 8 oficiales', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.recepcion, estadoInvalidoDestino, adminUser);
      }).toThrow(BadRequestException);
      expect(() => {
        orderService.validarTransicionEstado(estadoInvalidoActual, estados.control, adminUser);
      }).toThrow(BadRequestException);
    });
  });

  describe('6. Facultad de rectificación administrativa (Admin Override)', () => {
    it('permite a un usuario administrador realizar rectificaciones cuando sea indispensable entre estados válidos', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.recepcion, estados.control, adminUser);
      }).not.toThrow();
    });

    it('permite al administrador mover una orden de Recepción a Entrega si fue cancelada por acuerdo', () => {
      expect(() => {
        orderService.validarTransicionEstado(estados.recepcion, estados.entrega, adminUser);
      }).not.toThrow();
    });
  });

  describe('7. Seguridad y blindaje contra suplantación de identidad (Anti-Spoofing en update())', () => {
    it('rechaza la operación con UnauthorizedException si falta el ID autenticado, aunque el payload contenga userId', async () => {
      const updateDto = {
        estadoOrdenId: 2,
        userId: 1, // El cliente intenta establecer el actor mediante el payload
      };

      // Invocación sin userId autenticado (undefined)
      await expect(orderService.update(1, updateDto as any, undefined)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(orderService.update(1, updateDto as any, undefined)).rejects.toThrow(
        /Se requiere un usuario autenticado/i
      );

      // Invocación con userId inválido (0)
      await expect(orderService.update(1, updateDto as any, 0)).rejects.toThrow(
        UnauthorizedException
      );

      // Comprobar que mockUserRepository.findOne jamás consultó la base con el userId del payload (1)
      expect(mockUserRepository.findOne).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        })
      );
    });

    it('ignora updateDto.userId manipulado y utiliza exclusivamente el usuario autenticado para validar transiciones', async () => {
      const mockOrder = {
        id: 1,
        workOrderNumber: '00001',
        estadoOrden: estados.recepcion,
        problemaReportado: 'Equipo no enciende',
      } as Order;

      jest.spyOn(orderService, 'findOne').mockResolvedValue(mockOrder);

      // El usuario autenticado es el Técnico (ID 2).
      // El cliente intenta enviar userId: 1 (Admin) en el cuerpo para forzar un salto inválido a Control (ID 7).
      const updateDto = {
        estadoOrdenId: 7, // Control (salto prohibido desde Recepción para técnicos)
        userId: 1, // Intento de spoofing de ID del Administrador
      };

      await expect(orderService.update(1, updateDto as any, 2)).rejects.toThrow(BadRequestException);
      await expect(orderService.update(1, updateDto as any, 2)).rejects.toThrow(
        /Transición de estado no permitida/i
      );

      // Comprobar que mockUserRepository.findOne consultó la identidad autenticada (ID 2) y no el ID 1 spoofed
      expect(mockUserRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
        })
      );
    });

    it('permite la rectificación cuando el usuario autenticado es realmente el Administrador', async () => {
      const mockOrder = {
        id: 1,
        workOrderNumber: '00001',
        estadoOrden: estados.recepcion,
        problemaReportado: 'Equipo no enciende',
      } as Order;

      jest.spyOn(orderService, 'findOne').mockResolvedValue(mockOrder);

      // El usuario autenticado es el Admin (ID 1)
      const updateDto = {
        estadoOrdenId: 7, // Salto a Control
      };

      const result = await orderService.update(1, updateDto as any, 1);
      expect(result).toBeDefined();
      expect(mockOrder.estadoOrden.id).toBe(7);
    });
  });
});
