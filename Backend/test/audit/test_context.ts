import axios, { AxiosInstance } from 'axios';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3000/api/v1';

export interface TestUserCredentials {
  id: number;
  email: string;
  password: string;
  role: string;
  cedula: string;
  token?: string;
}

export class AuditTestContext {
  public dataSource: DataSource;
  public apiClient: AxiosInstance;

  public testUsers: {
    admin?: TestUserCredentials;
    recep?: TestUserCredentials;
    tech?: TestUserCredentials;
    client?: TestUserCredentials;
  } = {};

  public createdEntityIds: {
    users: number[];
    equipos: number[];
    orders: number[];
    presupuestos: number[];
    actividades: number[];
    evidencias: number[];
    partes: number[];
  } = {
    users: [],
    equipos: [],
    orders: [],
    presupuestos: [],
    actividades: [],
    evidencias: [],
    partes: [],
  };

  constructor() {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_DATABASE || 'hdc',
      ssl: process.env.DB_SSL === 'true',
    });

    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      validateStatus: () => true, // capture all status codes
    });
  }

  async initialize() {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }

  async getAuthenticatedClient(role: 'admin' | 'recep' | 'tech' | 'client'): Promise<AxiosInstance> {
    const user = this.testUsers[role];
    if (!user || !user.token) {
      throw new Error(`User for role ${role} is not authenticated or not initialized`);
    }

    return axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
      validateStatus: () => true,
    });
  }

  // Generates valid Ecuadorian 10-digit ID matching modulo 10 algorithm
  generateValidCedula(seedPrefix = '175'): string {
    const digits = seedPrefix.split('').map(Number);
    while (digits.length < 9) {
      digits.push(Math.floor(Math.random() * 10));
    }
    const suma = digits.reduce((acc, val, idx) => {
      const mult = idx % 2 === 0 ? 2 : 1;
      const res = val * mult;
      return acc + (res > 9 ? res - 9 : res);
    }, 0);
    const digitoVerificador = (10 - (suma % 10)) % 10;
    return digits.join('') + (digitoVerificador === 10 ? 0 : digitoVerificador);
  }

  // Set up controlled test users for each role safely
  async setupTestUsers() {
    await this.initialize();
    const bcrypt = await import('bcryptjs');
    const defaultPassword = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const rolesMap: Record<string, { id: number; slug: string }> = {
      admin: { id: 1, slug: 'admin' },
      tech: { id: 2, slug: 'tech' },
      recep: { id: 3, slug: 'recep' },
      client: { id: 4, slug: 'client' },
    };

    for (const [roleKey, roleInfo] of Object.entries(rolesMap)) {
      const testEmail = `audit.${roleKey}@hospital.test`;
      
      // Check if user already exists
      let userRows = await this.dataSource.query(
        `SELECT id, correo, cedula FROM "users" WHERE correo = $1;`,
        [testEmail]
      );

      let userId: number;
      let cedula: string;

      if (userRows.length === 0) {
        // Generate valid cedula
        cedula = this.generateValidCedula(`17${roleInfo.id}`);
        // Ensure cedula is unique
        let cedulaExists = await this.dataSource.query(`SELECT id FROM "users" WHERE cedula = $1;`, [cedula]);
        while (cedulaExists.length > 0) {
          cedula = this.generateValidCedula(`17${roleInfo.id}`);
          cedulaExists = await this.dataSource.query(`SELECT id FROM "users" WHERE cedula = $1;`, [cedula]);
        }

        const insertRes = await this.dataSource.query(
          `INSERT INTO "users" (cedula, nombre, apellido, correo, telefono, direccion, ciudad, password, estado, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
           RETURNING id;`,
          [
            cedula,
            `Audit ${roleKey.toUpperCase()}`,
            'Tester',
            testEmail,
            `099887766${roleInfo.id}`,
            'Av. Pruebas 123',
            'Quito',
            hashedPassword,
          ]
        );
        userId = insertRes[0].id;
        this.createdEntityIds.users.push(userId);
      } else {
        userId = userRows[0].id;
        cedula = userRows[0].cedula;
        // Ensure password is up to date
        await this.dataSource.query(`UPDATE "users" SET password = $1 WHERE id = $2;`, [hashedPassword, userId]);
      }

      // Ensure user_role mapping exists
      const userRoleRows = await this.dataSource.query(
        `SELECT id FROM "user_roles" WHERE "userId" = $1 AND "roleId" = $2;`,
        [userId, roleInfo.id]
      );

      if (userRoleRows.length === 0) {
        await this.dataSource.query(
          `INSERT INTO "user_roles" ("userId", "roleId", "createdAt", "updatedAt")
           VALUES ($1, $2, NOW(), NOW());`,
          [userId, roleInfo.id]
        );
      }

      // Login via API to get real JWT token
      const loginRes = await this.apiClient.post('/auth/login', {
        correo: testEmail,
        password: defaultPassword,
      });

      if (loginRes.status !== 200 && loginRes.status !== 201) {
        throw new Error(`Failed to login as ${testEmail}: ${JSON.stringify(loginRes.data)}`);
      }

      this.testUsers[roleKey as 'admin' | 'recep' | 'tech' | 'client'] = {
        id: userId,
        email: testEmail,
        password: defaultPassword,
        role: roleKey,
        cedula,
        token: loginRes.data.token,
      };
    }
  }

  // Cleanup only audit test entities created during execution
  async cleanup() {
    if (!this.dataSource.isInitialized) return;

    try {
      // 1. Delete evidences created in test
      if (this.createdEntityIds.evidencias.length > 0) {
        await this.dataSource.query(
          `DELETE FROM "evidencia_tecnica" WHERE id = ANY($1);`,
          [this.createdEntityIds.evidencias]
        );
      }

      // 2. Delete activities created in test
      if (this.createdEntityIds.actividades.length > 0) {
        await this.dataSource.query(
          `DELETE FROM "actividad_tecnica" WHERE id = ANY($1);`,
          [this.createdEntityIds.actividades]
        );
      }

      // 3. Delete presupuestos created in test
      if (this.createdEntityIds.presupuestos.length > 0) {
        await this.dataSource.query(
          `DELETE FROM "detalle_repuestos" WHERE "presupuestoId" = ANY($1);`,
          [this.createdEntityIds.presupuestos]
        );
        await this.dataSource.query(
          `DELETE FROM "presupuesto" WHERE id = ANY($1);`,
          [this.createdEntityIds.presupuestos]
        );
      }

      // 4. Delete orders created in test
      if (this.createdEntityIds.orders.length > 0) {
        await this.dataSource.query(
          `DELETE FROM "notificaciones" WHERE "ordenServicioId" = ANY($1);`,
          [this.createdEntityIds.orders]
        );
        await this.dataSource.query(
          `DELETE FROM "historial_estado_orden" WHERE "ordenId" = ANY($1);`,
          [this.createdEntityIds.orders]
        );
        await this.dataSource.query(
          `DELETE FROM "orders" WHERE id = ANY($1);`,
          [this.createdEntityIds.orders]
        );
      }

      // 5. Delete equipos created in test
      if (this.createdEntityIds.equipos.length > 0) {
        await this.dataSource.query(
          `DELETE FROM "equipo" WHERE id = ANY($1);`,
          [this.createdEntityIds.equipos]
        );
      }

      // 6. Delete test parts created in test
      if (this.createdEntityIds.partes.length > 0) {
        await this.dataSource.query(
          `DELETE FROM "parte" WHERE id = ANY($1);`,
          [this.createdEntityIds.partes]
        );
      }

      // Note: We retain the 4 audit role users for repeatability across test runs,
      // but if temporary test users were created, clean them:
      const nonPermanentTestUsers = this.createdEntityIds.users.filter(
        (id) => !Object.values(this.testUsers).some((u) => u?.id === id)
      );
      if (nonPermanentTestUsers.length > 0) {
        await this.dataSource.query(
          `DELETE FROM "user_roles" WHERE "userId" = ANY($1);`,
          [nonPermanentTestUsers]
        );
        await this.dataSource.query(
          `DELETE FROM "users" WHERE id = ANY($1);`,
          [nonPermanentTestUsers]
        );
      }

      console.log('✓ Test fixtures safely cleaned up.');
    } catch (err: any) {
      console.warn('Warning during cleanup:', err.message);
    } finally {
      await this.dataSource.destroy();
    }
  }
}
