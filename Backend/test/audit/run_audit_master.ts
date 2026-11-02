import { AuditTestContext } from './test_context';
import { AuditReporter } from './audit_reporter';
import { runAuthSuite } from './suites/auth_suite';
import { runAdminSuite } from './suites/admin_suite';
import { runRecepSuite } from './suites/recep_suite';
import { runTechSuite } from './suites/tech_suite';
import { runClientSuite } from './suites/client_suite';
import { runE2ERepairSuite } from './suites/e2e_repair_suite';
import { runSecurityMatrixSuite } from './suites/security_matrix_suite';
import { runDataIntegritySuite } from './suites/data_integrity_suite';
import { runAccessibilitySuite } from './suites/accessibility_suite';
import * as path from 'path';

async function runMasterAudit() {
  console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║       HOSPITAL DEL COMPUTADOR — AUDITORÍA FUNCIONAL INTEGRAL Y SUITE E2E      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

  const reporter = new AuditReporter();
  const ctx = new AuditTestContext();

  try {
    console.log('[FASE 1] Inicializando contexto seguro y usuarios controlados para cada rol...');
    await ctx.setupTestUsers();
    console.log('✓ Usuarios de prueba listos:');
    console.log(`  - Administrador : ${ctx.testUsers.admin?.email} (ID ${ctx.testUsers.admin?.id})`);
    console.log(`  - Recepcionista : ${ctx.testUsers.recep?.email} (ID ${ctx.testUsers.recep?.id})`);
    console.log(`  - Técnico       : ${ctx.testUsers.tech?.email} (ID ${ctx.testUsers.tech?.id})`);
    console.log(`  - Cliente       : ${ctx.testUsers.client?.email} (ID ${ctx.testUsers.client?.id})`);

    // Run test suites
    await runAuthSuite(ctx, reporter);
    await runAdminSuite(ctx, reporter);
    await runRecepSuite(ctx, reporter);
    await runTechSuite(ctx, reporter);
    await runClientSuite(ctx, reporter);
    await runE2ERepairSuite(ctx, reporter);
    await runSecurityMatrixSuite(ctx, reporter);
    await runDataIntegritySuite(ctx, reporter);
    await runAccessibilitySuite(reporter);

  } catch (err: any) {
    console.error('\n❌ Error crítico durante la ejecución de la auditoría:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    console.log('\n[FASE FINAL] Ejecutando limpieza segura de artefactos de prueba...');
    await ctx.cleanup();

    const summary = reporter.getSummary();
    console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                         RESUMEN DE LA AUDITORÍA                                ║');
    console.log('╠════════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║ Total Pruebas Ejecutadas: ${summary.total.toString().padEnd(52)}║`);
    console.log(`║ Exitosas (PASS)         : ${summary.passed.toString().padEnd(52)}║`);
    console.log(`║ Fallidas (FAIL)         : ${summary.failed.toString().padEnd(52)}║`);
    console.log(`║ Bloqueadas (BLOCKED)    : ${summary.blocked.toString().padEnd(52)}║`);
    console.log(`║ Tasa de Aprobación      : ${summary.passRate.padEnd(52)}║`);
    console.log(`║ Tiempo Total            : ${(summary.totalDurationMs + ' ms').padEnd(52)}║`);
    console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

    const reportPath = path.join(__dirname, 'audit_results.json');
    reporter.saveReport(reportPath);
  }
}

runMasterAudit();
