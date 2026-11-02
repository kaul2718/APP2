import { AuditTestContext } from './test_context';
import { AuditReporter } from './audit_reporter';
import { runExpressCompletaFlowTest } from './suites/test_express_completa_flow';

async function runExpressCompletaAudit() {
  console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  VERIFICACIÓN: FLUJO EXPRESS, COMPLETA, CONVERSIÓN Y ACTAS PDF HOSPITAL COMP   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

  const reporter = new AuditReporter();
  const ctx = new AuditTestContext();

  try {
    console.log('[FASE 1] Configurando contexto seguro de pruebas...');
    await ctx.setupTestUsers();

    await runExpressCompletaFlowTest(ctx, reporter);

  } catch (err: any) {
    console.error('\n❌ Error crítico durante la ejecución de las pruebas:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    console.log('\n[FASE FINAL] Limpieza de artefactos...');
    await ctx.cleanup();

    const summary = reporter.getSummary();
    console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                         RESUMEN DE PRUEBAS DEL FLUJO                           ║');
    console.log('╠════════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║ Total Pruebas Ejecutadas: ${summary.total.toString().padEnd(52)}║`);
    console.log(`║ Exitosas (PASS)         : ${summary.passed.toString().padEnd(52)}║`);
    console.log(`║ Fallidas (FAIL)         : ${summary.failed.toString().padEnd(52)}║`);
    console.log(`║ Tasa de Aprobación      : ${summary.passRate.padEnd(52)}║`);
    console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

    process.exit(summary.failed > 0 ? 1 : 0);
  }
}

runExpressCompletaAudit();
