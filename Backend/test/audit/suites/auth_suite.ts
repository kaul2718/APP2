import { AuditTestContext } from '../test_context';
import { AuditReporter } from '../audit_reporter';

export async function runAuthSuite(ctx: AuditTestContext, reporter: AuditReporter) {
  console.log('\n--- SUITE 1: AUTENTICACIÓN Y SESIONES ---');

  // AUTH-01: Login correcto por rol
  for (const role of ['admin', 'recep', 'tech', 'client'] as const) {
    const t0 = Date.now();
    const user = ctx.testUsers[role]!;
    const res = await ctx.apiClient.post('/auth/login', {
      correo: user.email,
      password: user.password,
    });

    const success = res.status === 200 || res.status === 201;
    const hasToken = Boolean(res.data?.token);
    const returnedRole = res.data?.user?.role;

    reporter.record({
      id: `AUTH-01-${role.toUpperCase()}`,
      role: role === 'admin' ? 'Administrador' : role === 'recep' ? 'Recepcionista' : role === 'tech' ? 'Técnico' : 'Cliente',
      module: 'Autenticación',
      scenario: `Login correcto para rol ${role}`,
      status: success && hasToken && returnedRole === role ? 'PASS' : 'FAIL',
      expected: `HTTP 200/201 con token JWT y role='${role}'`,
      actual: `HTTP ${res.status}, role='${returnedRole}', tokenPresent=${hasToken}`,
      evidence: `Token: ${res.data?.token?.substring(0, 20)}... | User ID: ${res.data?.user?.id}`,
      durationMs: Date.now() - t0,
    });
  }

  // AUTH-02: Credenciales incorrectas
  {
    const t0 = Date.now();
    const res = await ctx.apiClient.post('/auth/login', {
      correo: ctx.testUsers.admin!.email,
      password: 'WRONG_PASSWORD_999!',
    });

    reporter.record({
      id: 'AUTH-02',
      role: 'General',
      module: 'Autenticación',
      scenario: 'Intento de inicio de sesión con contraseña incorrecta',
      status: res.status === 401 ? 'PASS' : 'FAIL',
      expected: 'HTTP 401 Unauthorized',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // AUTH-03: Usuario inexistente
  {
    const t0 = Date.now();
    const res = await ctx.apiClient.post('/auth/login', {
      correo: 'nonexistent_user_999999@hdc.test',
      password: 'SomePassword123!',
    });

    reporter.record({
      id: 'AUTH-03',
      role: 'General',
      module: 'Autenticación',
      scenario: 'Intento de inicio de sesión con correo inexistente',
      status: res.status === 401 ? 'PASS' : 'FAIL',
      expected: 'HTTP 401 Unauthorized',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // AUTH-04: Acceso a ruta protegida sin token
  {
    const t0 = Date.now();
    const res = await ctx.apiClient.get('/orders');

    reporter.record({
      id: 'AUTH-04',
      role: 'General',
      module: 'Autenticación',
      scenario: 'Consulta de recurso protegido sin cabecera Authorization',
      status: res.status === 401 ? 'PASS' : 'FAIL',
      expected: 'HTTP 401 Unauthorized',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // AUTH-05: Acceso con token inválido / alterado
  {
    const t0 = Date.now();
    const res = await ctx.apiClient.get('/orders', {
      headers: { Authorization: 'Bearer INVALID_MALFORMED_JWT_TOKEN' },
    });

    reporter.record({
      id: 'AUTH-05',
      role: 'General',
      module: 'Autenticación',
      scenario: 'Consulta con token JWT adulterado o inválido',
      status: res.status === 401 ? 'PASS' : 'FAIL',
      expected: 'HTTP 401 Unauthorized',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // AUTH-06: Endpoint de perfil con token válido
  {
    const t0 = Date.now();
    const client = await ctx.getAuthenticatedClient('admin');
    const res = await client.get('/auth/profile');

    reporter.record({
      id: 'AUTH-06',
      role: 'Administrador',
      module: 'Autenticación',
      scenario: 'Consulta de perfil propio autenticado (/auth/profile)',
      status: res.status === 200 && res.data?.correo === ctx.testUsers.admin!.email ? 'PASS' : 'FAIL',
      expected: `HTTP 200 con correo='${ctx.testUsers.admin!.email}'`,
      actual: `HTTP ${res.status}, correo='${res.data?.correo}'`,
      evidence: `Profile ID: ${res.data?.id}, Roles: ${JSON.stringify(res.data?.userRoles?.map((ur: any) => ur.rol?.slug))}`,
      durationMs: Date.now() - t0,
    });
  }
}
