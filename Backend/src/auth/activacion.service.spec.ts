import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivacionService } from './activacion.service';
import { ActivacionCuenta, TipoActivacion } from './entities/activacion-cuenta.entity';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

describe('ActivacionService - Pruebas Obligatorias de Activación y Seguridad', () => {
  let service: ActivacionService;

  const mockActivacionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:4000';
      if (key === 'ACTIVACION_EXPIRATION_HOURS') return 48;
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivacionService,
        {
          provide: getRepositoryToken(ActivacionCuenta),
          useValue: mockActivacionRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ActivacionService>(ActivacionService);
  });

  describe('1. Generación de credenciales de activación', () => {
    it('debe generar token único de activación (hash SHA-256 en BD y vigencia de 48 horas)', async () => {
      // Cliente existente sin contraseña
      mockUserRepo.findOne
        .mockResolvedValueOnce({
          id: 10,
          nombre: 'Juan',
          apellido: 'Perez',
          cedula: '0103644480',
          correo: 'juan@example.com',
          estado: true,
          userRoles: [{ rol: { slug: 'client' } }],
        })
        .mockResolvedValueOnce({
          id: 10,
          password: null, // Sin contraseña activa
        });

      mockActivacionRepo.update.mockResolvedValue({ affected: 0 });
      mockActivacionRepo.create.mockImplementation((dto) => dto);
      mockActivacionRepo.save.mockImplementation((ent) => Promise.resolve({ id: 1, ...ent }));

      const result = await service.generarTokenActivacion(
        { usuarioId: 10, tipo: TipoActivacion.ACTIVACION },
        1, // operadorId
      );

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.token.length).toBe(32); // 16 bytes hex = 32 caracteres
      expect(result.qrUrl).toContain(`/activar-cuenta?token=${result.token}`);
      expect(result.qrDataUrl).toContain('data:image/png;base64');

      // Verificar que en la base de datos se almacena ÚNICAMENTE el hash SHA-256
      const savedCall = mockActivacionRepo.create.mock.calls[0][0];
      const expectedHash = crypto.createHash('sha256').update(result.token).digest('hex');
      expect(savedCall.tokenHash).toBe(expectedHash);
      expect(savedCall.tokenHash).not.toBe(result.token);

      // Verificar vigencia aproximada de 48 horas
      const diffHours = (new Date(savedCall.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
      expect(Math.round(diffHours)).toBe(48);
    });

    it('debe revocar credenciales anteriores pendientes del mismo usuario antes de generar una nueva', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce({
          id: 10,
          estado: true,
          userRoles: [{ rol: { slug: 'client' } }],
        })
        .mockResolvedValueOnce({ id: 10, password: null });

      mockActivacionRepo.update.mockResolvedValue({ affected: 1 });
      mockActivacionRepo.create.mockImplementation((dto) => dto);
      mockActivacionRepo.save.mockImplementation((ent) => Promise.resolve({ id: 2, ...ent }));

      await service.generarTokenActivacion({ usuarioId: 10 }, 1);

      expect(mockActivacionRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioId: 10, usedAt: expect.anything(), revokedAt: expect.anything() }),
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
    });

    it('debe rechazar generación de token de primera activación si la cuenta ya tiene contraseña configurada', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce({
          id: 10,
          estado: true,
          userRoles: [{ rol: { slug: 'client' } }],
        })
        .mockResolvedValueOnce({
          id: 10,
          password: '$2a$10$hashedpasswordalreadyhere', // ya tiene password
        });

      await expect(
        service.generarTokenActivacion({ usuarioId: 10, tipo: TipoActivacion.ACTIVACION }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe permitir generación de credencial presencial si el tipo es RECUPERACION_PRESENCIAL aunque ya tenga clave', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce({
          id: 10,
          nombre: 'Juan',
          apellido: 'Perez',
          cedula: '0103644480',
          estado: true,
          userRoles: [{ rol: { slug: 'client' } }],
        })
        .mockResolvedValueOnce({
          id: 10,
          password: '$2a$10$hashedpasswordalreadyhere',
        });

      mockActivacionRepo.update.mockResolvedValue({ affected: 0 });
      mockActivacionRepo.create.mockImplementation((dto) => dto);
      mockActivacionRepo.save.mockImplementation((ent) => Promise.resolve({ id: 3, ...ent }));

      const result = await service.generarTokenActivacion(
        { usuarioId: 10, tipo: TipoActivacion.RECUPERACION_PRESENCIAL },
        1,
      );

      expect(result.success).toBe(true);
      expect(result.tipo).toBe(TipoActivacion.RECUPERACION_PRESENCIAL);
    });
  });

  describe('2. Validación de credencial de activación', () => {
    it('debe validar exitosamente un token activo no consumido', async () => {
      const rawSecret = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
      const tokenHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

      mockActivacionRepo.findOne.mockResolvedValue({
        id: 1,
        tokenHash,
        tipo: TipoActivacion.ACTIVACION,
        usedAt: null,
        revokedAt: null,
        intentosFallidos: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Vence en 24h
        usuario: {
          nombre: 'GEOVANY',
          apellido: 'SALAZAR',
          cedula: '0103644480',
        },
      });

      const res = await service.validarTokenActivacion(rawSecret);
      expect(res.valido).toBe(true);
      expect(res.cliente?.cedula).toBe('0103644480');
    });

    it('debe rechazar token expirado (> 48h)', async () => {
      const rawSecret = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
      mockActivacionRepo.findOne.mockResolvedValue({
        id: 1,
        usedAt: null,
        revokedAt: null,
        intentosFallidos: 0,
        expiresAt: new Date(Date.now() - 1000), // Expirado hace un segundo
      });

      const res = await service.validarTokenActivacion(rawSecret);
      expect(res.valido).toBe(false);
      expect(res.mensaje).toContain('ha expirado');
    });

    it('debe rechazar token ya consumido previamente', async () => {
      const rawSecret = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
      mockActivacionRepo.findOne.mockResolvedValue({
        id: 1,
        usedAt: new Date(Date.now() - 60000), // Ya consumido
        revokedAt: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const res = await service.validarTokenActivacion(rawSecret);
      expect(res.valido).toBe(false);
      expect(res.mensaje).toContain('ya fue utilizada');
    });

    it('debe rechazar token revocado', async () => {
      const rawSecret = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
      mockActivacionRepo.findOne.mockResolvedValue({
        id: 1,
        usedAt: null,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const res = await service.validarTokenActivacion(rawSecret);
      expect(res.valido).toBe(false);
      expect(res.mensaje).toContain('cancelada o sustituida');
    });

    it('debe rechazar token con 5 o más intentos fallidos', async () => {
      const rawSecret = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
      mockActivacionRepo.findOne.mockResolvedValue({
        id: 1,
        usedAt: null,
        revokedAt: null,
        intentosFallidos: 5,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const res = await service.validarTokenActivacion(rawSecret);
      expect(res.valido).toBe(false);
      expect(res.mensaje).toContain('demasiados intentos fallidos');
    });
  });

  describe('3. Consumo atómico de token y establecimiento de clave personal', () => {
    it('debe consumir el token, encriptar con bcrypt y revocar credenciales pendientes', async () => {
      const rawSecret = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
      const registroSimulado = {
        id: 1,
        usuarioId: 10,
        tipo: TipoActivacion.ACTIVACION,
        usedAt: null,
        revokedAt: null,
        intentosFallidos: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const userSimulado = {
        id: 10,
        cedula: '0103644480',
        nombre: 'GEOVANY',
        apellido: 'SALAZAR',
        estado: true,
      };

      const mockQueryBuilder = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(registroSimulado),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };

      mockActivacionRepo.manager.transaction.mockImplementation(async (cb) => {
        const mockEntityManager = {
          createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          findOne: jest.fn().mockImplementation((entityClass, options) => {
            if (options.select) {
              return Promise.resolve({ id: 10, password: null });
            }
            return Promise.resolve(userSimulado);
          }),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        return await cb(mockEntityManager);
      });

      const res = await service.consumirTokenActivacion({
        token: rawSecret,
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      expect(res.success).toBe(true);
      expect(res.cliente.cedula).toBe('0103644480');
    });

    it('debe rechazar doble consumo simultáneo del mismo token (bloqueo transaccional)', async () => {
      const rawSecret = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

      const mockQueryBuilder = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 1,
          usedAt: new Date(), // Ya consumido en una transacción concurrente
        }),
      };

      mockActivacionRepo.manager.transaction.mockImplementation(async (cb) => {
        const mockEntityManager = {
          createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        };
        return await cb(mockEntityManager);
      });

      await expect(
        service.consumirTokenActivacion({
          token: rawSecret,
          password: 'Password123',
          confirmPassword: 'Password123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe validar complejidad de la contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número)', async () => {
      await expect(
        service.consumirTokenActivacion({
          token: 'token123456789012345678',
          password: 'short',
          confirmPassword: 'short',
        }),
      ).rejects.toThrow('al menos 8 caracteres');

      await expect(
        service.consumirTokenActivacion({
          token: 'token123456789012345678',
          password: 'solominusculas1',
          confirmPassword: 'solominusculas1',
        }),
      ).rejects.toThrow('letra mayúscula');

      await expect(
        service.consumirTokenActivacion({
          token: 'token123456789012345678',
          password: 'SoloMayusculas',
          confirmPassword: 'SoloMayusculas',
        }),
      ).rejects.toThrow('al menos un número');
    });
  });
});

