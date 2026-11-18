import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { User } from './entities/user.entity';
import { Rol } from '../rol/entities/rol.entity';
import { UserRole } from '../user-role/entities/user-role.entity';
import { RolePermission } from '../role-permission/entities/role-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Order } from '../orders/entities/order.entity';
import { ActividadTecnica } from '../actividad-tecnica/entities/actividad-tecnica.entity';
import { Presupuesto } from '../presupuesto/entities/presupuesto.entity';
import { AutorizacionPresupuesto } from '../presupuesto/entities/autorizacion-presupuesto.entity';
import { DetallePresupuestoItem } from '../detalle-presupuesto-item/entities/detalle-presupuesto-item.entity';
import { Casillero } from '../casillero/entities/casillero.entity';
import { Equipo } from '../equipo/entities/equipo.entity';
import { EvidenciaTecnica } from '../evidencia-tecnica/entities/evidencia-tecnica.entity';
import { EstadoOrden } from '../estado-orden/entities/estado-orden.entity';
import { EstadoPresupuesto } from '../estado-presupuesto/entities/estado-presupuesto.entity';
import { HistorialEstadoOrden } from '../historial-estado-orden/entities/historial-estado-orden.entity';
import { DocumentoOrden } from '../documentos-orden/entities/documento-orden.entity';
import { Marca } from '../marca/entities/marca.entity';
import { Modelo } from '../modelo/entities/modelo.entity';
import { TipoEquipo } from '../tipo-equipo/entities/tipo-equipo.entity';
import { TipoActividadTecnica } from '../tipo-actividad-tecnica/entities/tipo-actividad-tecnica.entity';
import { Parte } from '../parte/entities/parte.entity';
import { Categoria } from '../categoria/entities/categoria.entity';
import { UsersService } from './users.service';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const TEST_DB = 'hdc_users_pg_spec';

describe('UsersService.findAllPaginated — Integración real con PostgreSQL', () => {
  let dataSource: DataSource;
  let usersService: UsersService;

  beforeAll(async () => {
    const adminClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: 'postgres',
    });
    await adminClient.connect();
    await adminClient.query(`DROP DATABASE IF EXISTS "${TEST_DB}" WITH (FORCE)`);
    await adminClient.query(`CREATE DATABASE "${TEST_DB}" WITH ENCODING 'UTF8'`);
    await adminClient.end();

    const pg = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: TEST_DB,
    });
    await pg.connect();
    const sqlDir = path.join(__dirname, '../../sql');
    const files = fs.readdirSync(sqlDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      await pg.query(fs.readFileSync(path.join(sqlDir, file), 'utf8'));
    }

    await pg.query(`
      INSERT INTO "roles" ("nombre", "slug", "activo")
      VALUES
        ('Administrador', 'admin', TRUE),
        ('Técnico', 'tech', TRUE),
        ('Recepcionista', 'recep', TRUE),
        ('Cliente', 'client', TRUE)
      ON CONFLICT ("slug") DO NOTHING;
    `);
    const rolesRes = await pg.query(`SELECT id, slug FROM "roles"`);
    const roleBySlug = Object.fromEntries(rolesRes.rows.map((r) => [r.slug, r.id]));

    const usersRes = await pg.query(`
      INSERT INTO "users" ("cedula", "nombre", "apellido", "correo", "telefono", "direccion", "ciudad", "estado", "habilitadoTecnico")
      VALUES
        ('0501000001', 'AdminTech', 'Habilitado', 'admintech@test.local', '0991000001', 'Dir', 'Latacunga', TRUE, TRUE),
        ('0501000002', 'AdminPuro', 'NoTech', 'adminpuro@test.local', '0991000002', 'Dir', 'Latacunga', TRUE, FALSE),
        ('0501000003', 'RecepTech', 'Habilitado', 'receptech@test.local', '0991000003', 'Dir', 'Latacunga', TRUE, TRUE),
        ('0501000004', 'TechPuro', 'Activo', 'techpuro@test.local', '0991000004', 'Dir', 'Latacunga', TRUE, TRUE),
        ('0501000005', 'TechInactivo', 'Desactivado', 'techinact@test.local', '0991000005', 'Dir', 'Latacunga', FALSE, TRUE),
        ('0501000006', 'ClientePuro', 'Uno', 'cliente1@test.local', '0991000006', 'Dir', 'Latacunga', TRUE, FALSE)
      RETURNING id, cedula;
    `);
    const uByCedula = Object.fromEntries(usersRes.rows.map((u) => [u.cedula, u.id]));

    await pg.query(
      `INSERT INTO "user_roles" ("userId", "roleId") VALUES
        ($1, $7),
        ($2, $7),
        ($3, $8),
        ($4, $9),
        ($5, $9),
        ($6, $10)`,
      [
        uByCedula['0501000001'],
        uByCedula['0501000002'],
        uByCedula['0501000003'],
        uByCedula['0501000004'],
        uByCedula['0501000005'],
        uByCedula['0501000006'],
        roleBySlug['admin'],
        roleBySlug['recep'],
        roleBySlug['tech'],
        roleBySlug['client'],
      ],
    );
    await pg.end();

    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: TEST_DB,
      entities: [
        User,
        Rol,
        UserRole,
        RolePermission,
        Permission,
        Order,
        ActividadTecnica,
        Presupuesto,
        AutorizacionPresupuesto,
        DetallePresupuestoItem,
        Casillero,
        Equipo,
        EvidenciaTecnica,
        EstadoOrden,
        EstadoPresupuesto,
        HistorialEstadoOrden,
        DocumentoOrden,
        Marca,
        Modelo,
        TipoEquipo,
        TipoActividadTecnica,
        Parte,
        Categoria,
      ],
      synchronize: false,
    });
    await dataSource.initialize();

    usersService = new UsersService(
      dataSource.getRepository(User),
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    const adminClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: 'postgres',
    });
    await adminClient.connect();
    await adminClient.query(`DROP DATABASE IF EXISTS "${TEST_DB}" WITH (FORCE)`);
    await adminClient.end();
  });

  it('genera SQL válido con "user"."id" escapado y ejecuta /users/all?role=tech sin SyntaxError', async () => {
    const qb = dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.rol', 'rol')
      .where('user.estado = :estado', { estado: true })
      .andWhere(
        'EXISTS (SELECT 1 FROM "user_roles" ur_f INNER JOIN "roles" r_f ON r_f."id" = ur_f."roleId" WHERE ur_f."userId" = "user"."id" AND r_f."slug" = :role AND r_f."activo" = TRUE AND r_f."deletedAt" IS NULL)',
        { role: 'tech' },
      );

    const [sql] = qb.getQueryAndParameters();
    expect(sql).toContain('ur_f."userId" = "user"."id"');
    expect(sql).not.toContain('= user."id"');

    const res = await usersService.findAllPaginated(1, 1000, undefined, false, 'tech');
    expect(res.total).toBe(1);
    expect(res.data.map((u) => u.cedula)).toEqual(['0501000004']);
  });

  it('ejecuta /users/all?role=client correctamente sin errores SQL', async () => {
    const res = await usersService.findAllPaginated(1, 100, undefined, false, 'client');
    expect(res.total).toBe(1);
    expect(res.data[0].cedula).toBe('0501000006');
  });

  it('ejecuta /users/all?habilitadoTecnico=true devolviendo admin, recep y tech habilitados, excluyendo desactivados y no habilitados', async () => {
    const res = await usersService.findAllPaginated(1, 100, undefined, false, 'all', true);
    const cedulas = res.data.map((u) => u.cedula).sort();
    expect(cedulas).toEqual(['0501000001', '0501000003', '0501000004']);
    expect(cedulas).not.toContain('0501000002'); // admin sin habilitadoTecnico
    expect(cedulas).not.toContain('0501000005'); // tech desactivado (estado=false)
    expect(cedulas).not.toContain('0501000006'); // cliente sin habilitadoTecnico
  });

  it('búsqueda y paginación funcionan correctamente con filtro de rol y habilitadoTecnico', async () => {
    const res = await usersService.findAllPaginated(1, 1, 'Habilitado', false, 'all', true);
    expect(res.total).toBe(2); // AdminTech Habilitado y RecepTech Habilitado
    expect(res.data).toHaveLength(1);
  });
});

