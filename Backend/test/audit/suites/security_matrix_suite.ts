import { AuditTestContext } from '../test_context';
import { AuditReporter } from '../audit_reporter';

export async function runSecurityMatrixSuite(ctx: AuditTestContext, reporter: AuditReporter) {
  console.log('\n--- SUITE 7: PRUEBAS CRUZADAS DE SEGURIDAD ENTRE ROLES ---');

  const clientAuth = await ctx.getAuthenticatedClient('client');
  const recepAuth = await ctx.getAuthenticatedClient('recep');
  const techAuth = await ctx.getAuthenticatedClient('tech');

  // SEC-01: Cliente intentando acceder a gestión de usuarios
  {
    const t0 = Date.now();
    const res = await clientAuth.get('/users/all');
    reporter.record({
      id: 'SEC-01',
      role: 'Seguridad',
      module: 'Matriz de Autorización',
      scenario: 'Cliente intentando listar usuarios del sistema (/users/all)',
      status: res.status === 403 ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // SEC-02: Cliente intentando crear una orden técnica directamente
  {
    const t0 = Date.now();
    const res = await clientAuth.post('/orders', {
      clientId: ctx.testUsers.client!.id,
      equipoId: 1,
      problemaReportado: 'Intento de creación directa',
    });
    reporter.record({
      id: 'SEC-02',
      role: 'Seguridad',
      module: 'Matriz de Autorización',
      scenario: 'Cliente intentando crear orden directamente por API',
      status: res.status === 403 ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // SEC-03: Cliente intentando solicitar URL prefirmada de subida a R2
  {
    const t0 = Date.now();
    const res = await clientAuth.post('/evidencias-tecnicas/presigned-upload', {
      ordenId: 1,
      fileName: 'hacker.mp4',
      mimeType: 'video/mp4',
    });
    reporter.record({
      id: 'SEC-03',
      role: 'Seguridad',
      module: 'Matriz de Autorización',
      scenario: 'Cliente intentando solicitar URL prefirmada de subida a R2',
      status: res.status === 403 ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden (Clientes no pueden subir evidencias)',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // SEC-04: Recepcionista intentando eliminar una orden de servicio
  {
    const t0 = Date.now();
    const res = await recepAuth.delete('/orders/1');
    reporter.record({
      id: 'SEC-04',
      role: 'Seguridad',
      module: 'Matriz de Autorización',
      scenario: 'Recepcionista intentando eliminar orden de servicio (DELETE /orders/:id)',
      status: res.status === 403 ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden (Exclusivo de admin)',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // SEC-05: Técnico intentando eliminar una orden de servicio
  {
    const t0 = Date.now();
    const res = await techAuth.delete('/orders/1');
    reporter.record({
      id: 'SEC-05',
      role: 'Seguridad',
      module: 'Matriz de Autorización',
      scenario: 'Técnico intentando eliminar orden de servicio (DELETE /orders/:id)',
      status: res.status === 403 ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden (Exclusivo de admin)',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // SEC-06: Técnico intentando gestionar roles de usuario
  {
    const t0 = Date.now();
    const res = await techAuth.post('/roles', {
      nombre: 'Nuevo Rol',
      slug: 'nuevo.rol',
    });
    reporter.record({
      id: 'SEC-06',
      role: 'Seguridad',
      module: 'Matriz de Autorización',
      scenario: 'Técnico intentando crear roles en el sistema (/roles)',
      status: res.status === 403 ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden (Exclusivo de admin)',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // SEC-07: Recepcionista intentando gestionar permisos
  {
    const t0 = Date.now();
    const res = await recepAuth.post('/permissions', {
      nombre: 'Permiso Hacked',
      slug: 'hacked.permission',
    });
    reporter.record({
      id: 'SEC-07',
      role: 'Seguridad',
      module: 'Matriz de Autorización',
      scenario: 'Recepcionista intentando crear permisos (/permissions)',
      status: res.status === 403 ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden (Exclusivo de admin)',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }

  // SEC-08: Cliente intentando acceder al catálogo de roles
  {
    const t0 = Date.now();
    const res = await clientAuth.get('/roles');
    reporter.record({
      id: 'SEC-08',
      role: 'Seguridad',
      module: 'Matriz de Autorización',
      scenario: 'Cliente intentando consultar catálogo de roles (/roles)',
      status: res.status === 403 ? 'PASS' : 'FAIL',
      expected: 'HTTP 403 Forbidden',
      actual: `HTTP ${res.status}`,
      evidence: JSON.stringify(res.data),
      durationMs: Date.now() - t0,
    });
  }
}
