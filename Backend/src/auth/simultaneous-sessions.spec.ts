import {
  ExecutionContext,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import * as bcryptjs from 'bcryptjs';
import { AuthService } from './auth.service';
import { AuthGuard } from './guard/auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { PermissionsGuard } from './guard/permissions.guard';
import { jwtConstants } from './constants/jwt.constant';

describe('Auditoría de Sesiones Simultáneas (PC + Celular) — Fases 2 y 6', () => {
  let jwtService: JwtService;
  let authService: AuthService;
  let authGuard: AuthGuard;
  let rolesGuard: RolesGuard;
  let permissionsGuard: PermissionsGuard;
  let mockUsersService: any;
  let hashedPassword: string;
  let activeTechnicianState: boolean;

  beforeAll(async () => {
    hashedPassword = await bcryptjs.hash('Tecnico2026!', 10);
  });

  beforeEach(() => {
    activeTechnicianState = true;
    jwtService = new JwtService({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    });

    const getTechUser = () => {
      if (!activeTechnicianState) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return {
        id: 77,
        cedula: '0604123456',
        nombre: 'Roberto',
        apellido: 'Técnico',
        correo: 'roberto.tech@hospitaldelcomputador.com',
        telefono: '0991234567',
        direccion: 'Taller Central',
        ciudad: 'Riobamba',
        password: hashedPassword,
        estado: activeTechnicianState,
        role: 'tech',
        userRoles: [
          {
            rol: {
              id: 2,
              slug: 'tech',
              nombre: 'Técnico',
              rolePermissions: [
                { permission: { slug: 'orders.view' } },
                { permission: { slug: 'orders.update' } },
                { permission: { slug: 'presupuestos.view' } },
                { permission: { slug: 'presupuestos.approve' } },
              ],
            },
          },
        ],
      };
    };

    mockUsersService = {
      findByEmail: jest.fn().mockImplementation(async (email: string) => {
        if (email === 'roberto.tech@hospitaldelcomputador.com' && activeTechnicianState) {
          return getTechUser();
        }
        return null;
      }),
      findOne: jest.fn().mockImplementation(async (id: number) => {
        if (id === 77) {
          return getTechUser();
        }
        throw new NotFoundException('Usuario no encontrado');
      }),
    };

    authService = new AuthService(mockUsersService, jwtService, {} as any);
    authGuard = new AuthGuard(jwtService, mockUsersService);
    rolesGuard = new RolesGuard(new Reflector());
    permissionsGuard = new PermissionsGuard(new Reflector(), {} as any);
  });

  function buildHttpContext(authHeader?: string): { context: ExecutionContext; request: any } {
    const request: any = {
      headers: authHeader ? { authorization: authHeader } : {},
      user: undefined,
    };
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    return { context, request };
  }

  it('Escenario Principal (PC -> Celular): Técnico inicia sesión en PC y luego en Celular; ambos dispositivos operan simultáneamente sin invalidarse', async () => {
    // 1. Dispositivo A (PC - Escritorio) inicia sesión
    const pcSession = await authService.login({
      identificador: 'roberto.tech@hospitaldelcomputador.com',
      password: 'Tecnico2026!',
    });
    expect(pcSession.token).toBeDefined();
    expect(pcSession.user.role).toBe('tech');

    // 2. Dispositivo A consulta órdenes autorizadas
    const pcReq1 = buildHttpContext(`Bearer ${pcSession.token}`);
    await expect(authGuard.canActivate(pcReq1.context)).resolves.toBe(true);
    expect(pcReq1.request.user.id).toBe(77);

    // 3. Dispositivo B (Celular - Móvil) inicia sesión con la misma cuenta
    const mobileSession = await authService.login({
      identificador: 'roberto.tech@hospitaldelcomputador.com',
      password: 'Tecnico2026!',
    });
    expect(mobileSession.token).toBeDefined();

    // 4. Ambos dispositivos consultan recursos autorizados simultáneamente
    const [pcCheck, mobileCheck] = await Promise.all([
      authGuard.canActivate(buildHttpContext(`Bearer ${pcSession.token}`).context),
      authGuard.canActivate(buildHttpContext(`Bearer ${mobileSession.token}`).context),
    ]);
    expect(pcCheck).toBe(true);
    expect(mobileCheck).toBe(true);

    // 5. Dispositivo B (Celular) registra una operación autorizada y consulta perfil
    const mobileOpCtx = buildHttpContext(`Bearer ${mobileSession.token}`);
    await expect(authGuard.canActivate(mobileOpCtx.context)).resolves.toBe(true);
    const mobileProfile = await authService.profile(mobileOpCtx.request.user);
    expect(mobileProfile.id).toBe(77);

    // 6 y 7. Volver al Dispositivo A (PC) y comprobar que continúa utilizando la plataforma sin iniciar sesión nuevamente
    const pcAfterMobileOpCtx = buildHttpContext(`Bearer ${pcSession.token}`);
    await expect(authGuard.canActivate(pcAfterMobileOpCtx.context)).resolves.toBe(true);
    const pcProfile = await authService.profile(pcAfterMobileOpCtx.request.user);
    expect(pcProfile.id).toBe(77);
    expect(pcProfile.role).toBe('tech');
  });

  it('Escenario Invertido (Celular -> PC): Iniciar sesión primero en Celular y luego en PC mantiene ambas sesiones activas', async () => {
    const mobileSession = await authService.login({
      identificador: 'roberto.tech@hospitaldelcomputador.com',
      password: 'Tecnico2026!',
    });
    const pcSession = await authService.login({
      identificador: 'roberto.tech@hospitaldelcomputador.com',
      password: 'Tecnico2026!',
    });

    // Operación desde PC (segundo dispositivo)
    const pcCtx = buildHttpContext(`Bearer ${pcSession.token}`);
    await expect(authGuard.canActivate(pcCtx.context)).resolves.toBe(true);

    // El primer dispositivo (Celular) sigue completamente válido
    const mobileCtx = buildHttpContext(`Bearer ${mobileSession.token}`);
    await expect(authGuard.canActivate(mobileCtx.context)).resolves.toBe(true);
    expect(mobileCtx.request.user.correo).toBe('roberto.tech@hospitaldelcomputador.com');
  });

  it('Cierre de sesión independiente: Cerrar sesión en Dispositivo A no invalida Dispositivo B (y viceversa)', async () => {
    const deviceACookieJar: { token?: string } = {};
    const deviceBCookieJar: { token?: string } = {};

    deviceACookieJar.token = (
      await authService.login({
        identificador: 'roberto.tech@hospitaldelcomputador.com',
        password: 'Tecnico2026!',
      })
    ).token;

    deviceBCookieJar.token = (
      await authService.login({
        identificador: 'roberto.tech@hospitaldelcomputador.com',
        password: 'Tecnico2026!',
      })
    ).token;

    // Dispositivo A cierra sesión (NextAuth limpia su cookie local)
    delete deviceACookieJar.token;

    // Dispositivo A ya no puede acceder
    await expect(
      authGuard.canActivate(buildHttpContext(undefined).context),
    ).rejects.toThrow(UnauthorizedException);

    // Dispositivo B sigue autenticado y operativo
    await expect(
      authGuard.canActivate(buildHttpContext(`Bearer ${deviceBCookieJar.token}`).context),
    ).resolves.toBe(true);
  });

  it('Expiración individual: La expiración del token en Dispositivo A no invalida la sesión activa en Dispositivo B', async () => {
    // Dispositivo A tiene un token ya expirado
    const expiredTokenA = await jwtService.signAsync(
      { sub: 77, correo: 'roberto.tech@hospitaldelcomputador.com', cedula: '0604123456' },
      { expiresIn: -10 },
    );

    // Dispositivo B tiene un token vigente
    const validSessionB = await authService.login({
      identificador: 'roberto.tech@hospitaldelcomputador.com',
      password: 'Tecnico2026!',
    });

    // Dispositivo A recibe 401 Unauthorized
    await expect(
      authGuard.canActivate(buildHttpContext(`Bearer ${expiredTokenA}`).context),
    ).rejects.toThrow(UnauthorizedException);

    // Dispositivo B continúa funcionando sin interrupción
    await expect(
      authGuard.canActivate(buildHttpContext(`Bearer ${validSessionB.token}`).context),
    ).resolves.toBe(true);
  });

  it('Control de seguridad: Si el usuario es desactivado en BD, ambas sesiones simultáneas quedan bloqueadas inmediatamente', async () => {
    const pcSession = await authService.login({
      identificador: 'roberto.tech@hospitaldelcomputador.com',
      password: 'Tecnico2026!',
    });
    const mobileSession = await authService.login({
      identificador: 'roberto.tech@hospitaldelcomputador.com',
      password: 'Tecnico2026!',
    });

    // Desactivar al usuario en la base de datos
    activeTechnicianState = false;

    await expect(
      authGuard.canActivate(buildHttpContext(`Bearer ${pcSession.token}`).context),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      authGuard.canActivate(buildHttpContext(`Bearer ${mobileSession.token}`).context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('Resiliencia ante errores transitorios de BD: Un fallo interno de base de datos no se convierte falsamente en 401 Unauthorized', async () => {
    const pcSession = await authService.login({
      identificador: 'roberto.tech@hospitaldelcomputador.com',
      password: 'Tecnico2026!',
    });

    mockUsersService.findOne.mockRejectedValueOnce(
      new InternalServerErrorException('Timeout de conexión a PostgreSQL'),
    );

    await expect(
      authGuard.canActivate(buildHttpContext(`Bearer ${pcSession.token}`).context),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

