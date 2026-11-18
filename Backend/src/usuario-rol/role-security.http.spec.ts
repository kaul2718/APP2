import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { jwtConstants } from '../auth/constants/jwt.constant';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { PermissionsGuard } from '../auth/guard/permissions.guard';
import { UsuarioRolController } from './usuario-rol.controller';
import { UsuarioRolService } from './usuario-rol.service';
import { RolController } from '../rol/rol.controller';
import { RolService } from '../rol/rol.service';
import { PermissionsController } from '../permissions/permissions.controller';
import { PermissionsService } from '../permissions/permissions.service';
import { UsersController } from '../users/users.controller';
import { UsersService } from '../users/users.service';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { ActivacionService } from '../auth/activacion.service';

function buildActor(id: number, slug: string, perms: string[] = []) {
  return {
    id,
    correo: `${slug}${id}@hdc.test`,
    cedula: `050364681${id}`,
    estado: true,
    role: slug,
    userRoles: [
      {
        rol: {
          slug,
          rolePermissions: perms.map((p) => ({ permission: { slug: p } })),
        },
      },
    ],
  };
}

describe('Pruebas HTTP reales de seguridad de roles y regresión operativa', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const usersDb: Record<number, any> = {
    1: buildActor(1, 'admin', ['roles.manage', 'users.create', 'users.update']),
    2: buildActor(2, 'client', []),
    3: buildActor(3, 'tech', ['orders.view', 'orders.update']),
    4: buildActor(4, 'recep', ['orders.create', 'users.create']),
  };

  const mockUsuarioRolService = {
    create: jest.fn(async (dto) => ({ id: 100, ...dto })),
    findAll: jest.fn(async () => []),
    findOne: jest.fn(async (id) => ({ id, userId: 2, roleId: 1 })),
    findByUserId: jest.fn(async (userId) => [{ id: 100, userId, roleId: 2 }]),
    update: jest.fn(async (id, dto) => ({ id, ...dto })),
    remove: jest.fn(async () => ({ message: 'Eliminado' })),
    assignRoleToUser: jest.fn(async (userId, roleId) => ({ id: 101, userId, roleId })),
    removeRoleFromUser: jest.fn(async () => undefined),
  };

  const mockRolService = {
    create: jest.fn(async (dto) => ({ id: 10, ...dto })),
    findAll: jest.fn(async () => [{ id: 1, slug: 'admin' }, { id: 4, slug: 'client' }]),
    findOne: jest.fn(async (id) => ({ id, slug: 'admin' })),
    update: jest.fn(async (id, dto) => ({ id, ...dto })),
    remove: jest.fn(async () => ({ message: 'Eliminado' })),
    assignPermissions: jest.fn(async () => undefined),
    getPermissions: jest.fn(async () => []),
    setPermissions: jest.fn(async () => undefined),
    removePermission: jest.fn(async () => undefined),
  };

  const mockPermissionsService = {
    create: jest.fn(async (dto) => ({ id: 20, ...dto })),
    findAll: jest.fn(async () => [{ id: 1, slug: 'roles.manage' }]),
    findOne: jest.fn(async (id) => ({ id, slug: 'roles.manage' })),
    update: jest.fn(async (id, dto) => ({ id, ...dto })),
    remove: jest.fn(async () => ({ message: 'Eliminado' })),
  };

  const mockUsersService = {
    findOne: jest.fn(async (id: number) => usersDb[id] || null),
    findByEmail: jest.fn(async () => null),
    findAll: jest.fn(async () => []),
    create: jest.fn(async (dto) => ({ id: 55, ...dto })),
    update: jest.fn(async (id, dto) => ({ id, ...dto })),
    updatePassword: jest.fn(async () => ({ message: 'Contraseña actualizada' })),
    subirAvatar: jest.fn(async () => ({ fotoPerfilUrl: 'https://r2.test/avatar.png' })),
    eliminarAvatar: jest.fn(async () => undefined),
  };

  const mockAuthService = {
    register: jest.fn(async (dto) => {
      // Simula llamada real a AuthService.register validando que no propague roleIds
      const real = new AuthService(mockUsersService as any, jwtService, {} as any);
      return real.register(dto);
    }),
    login: jest.fn(async () => ({ token: 'jwt-ok', user: { id: 2, role: 'client' } })),
    profile: jest.fn(async (u) => ({ id: u.id, role: u.role })),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: jwtConstants.secret,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [
        UsuarioRolController,
        RolController,
        PermissionsController,
        UsersController,
        AuthController,
      ],
      providers: [
        AuthGuard,
        RolesGuard,
        PermissionsGuard,
        { provide: UsuarioRolService, useValue: mockUsuarioRolService },
        { provide: RolService, useValue: mockRolService },
        { provide: PermissionsService, useValue: mockPermissionsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivacionService, useValue: {} },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const tokenFor = (userId: number) =>
    jwtService.sign({ sub: userId, correo: usersDb[userId].correo });

  it('rechaza con 401 a usuarios anónimos en rutas protegidas de roles y permisos', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/user-roles/2/assign/1')
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/roles')
      .send({ nombre: 'Super', slug: 'super' })
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/permissions')
      .expect(401);
  });

  it('bloquea con 403 a client, tech y recep en asignación, actualización y eliminación de roles', async () => {
    for (const actorId of [2, 3, 4]) {
      const token = tokenFor(actorId);

      await request(app.getHttpServer())
        .post(`/api/v1/user-roles/${actorId}/assign/1`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/v1/user-roles')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: actorId, roleId: 1 })
        .expect(403);

      await request(app.getHttpServer())
        .patch('/api/v1/user-roles/100')
        .set('Authorization', `Bearer ${token}`)
        .send({ roleId: 1 })
        .expect(403);

      await request(app.getHttpServer())
        .delete('/api/v1/user-roles/100')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/api/v1/user-roles/${actorId}/remove/1`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      await request(app.getHttpServer())
        .put('/api/v1/roles/1/permissions')
        .set('Authorization', `Bearer ${token}`)
        .send({ permissionIds: [1] })
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/v1/permissions')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Hack', slug: 'hack.all' })
        .expect(403);
    }
  });

  it('bloquea rutas alternativas de escalación en /auth/register y /users', async () => {
    // 1. Registro público con roleIds=['admin'] -> fuerza 'client'
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        cedula: '0503646812',
        nombre: 'Nuevo',
        apellido: 'Cliente',
        correo: 'nuevo.cliente@test.com',
        telefono: '0991234567',
        direccion: 'Av Central',
        ciudad: 'Latacunga',
        password: 'Password123',
        roleIds: ['admin'],
      })
      .expect(201);

    expect(mockUsersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'client' }),
    );

    // 2. Técnico intentando crear usuario -> 403
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenFor(3)}`)
      .send({ nombre: 'X', role: 'admin' })
      .expect(403);

    // 3. Recepcionista intentando crear admin -> forzado a 'client'
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenFor(4)}`)
      .send({
        cedula: '0503646812',
        nombre: 'Cli',
        apellido: 'Uno',
        correo: 'cli1@test.com',
        telefono: '0991234568',
        direccion: 'Calle 1',
        ciudad: 'Latacunga',
        role: 'admin',
        roleIds: [1],
      })
      .expect(201);

    expect(mockUsersService.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ role: 'client', roleIds: undefined }),
    );

    // 4. Cliente y técnico intentando escalar mediante PATCH /users/:id
    await request(app.getHttpServer())
      .patch('/api/v1/users/2')
      .set('Authorization', `Bearer ${tokenFor(2)}`)
      .send({ roleIds: [1] })
      .expect(403);

    await request(app.getHttpServer())
      .patch('/api/v1/users/3')
      .set('Authorization', `Bearer ${tokenFor(3)}`)
      .send({ role: 'admin' })
      .expect(403);

    // 5. Técnico intentando editar a otro usuario
    await request(app.getHttpServer())
      .patch('/api/v1/users/2')
      .set('Authorization', `Bearer ${tokenFor(3)}`)
      .send({ nombre: 'Otro' })
      .expect(403);
  });

  it('permite operaciones normales y administración legítima por admin', async () => {
    const adminToken = tokenFor(1);
    const clientToken = tokenFor(2);
    const recepToken = tokenFor(4);

    // Admin asigna y retira rol
    await request(app.getHttpServer())
      .post('/api/v1/user-roles/2/assign/3')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .delete('/api/v1/user-roles/2/remove/3')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Admin edita usuario y sus roles
    await request(app.getHttpServer())
      .patch('/api/v1/users/3')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Carlos', roleIds: [3] })
      .expect(200);

    // Recepcionista edita datos de cliente (incluso enviando role: 'client' como hace useEditarUsuario)
    await request(app.getHttpServer())
      .patch('/api/v1/users/2')
      .set('Authorization', `Bearer ${recepToken}`)
      .send({ nombre: 'Cliente Editado', role: 'client' })
      .expect(200);

    // Cliente edita su propio perfil
    await request(app.getHttpServer())
      .patch('/api/v1/users/2')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ telefono: '0998887777', ciudad: 'Quito' })
      .expect(200);

    // Cliente cambia su foto de perfil
    await request(app.getHttpServer())
      .post('/api/v1/users/2/avatar')
      .set('Authorization', `Bearer ${clientToken}`)
      .attach('foto', Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
        filename: 'avatar.png',
        contentType: 'image/png',
      })
      .expect(201);

    // Login y cambio de contraseña
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identificador: '0503646812', password: 'Password123' })
      .expect(201);

    await request(app.getHttpServer())
      .patch('/api/v1/users/2/password')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ currentPassword: 'Password123', newPassword: 'NewPassword123' })
      .expect(200);
  });
});

