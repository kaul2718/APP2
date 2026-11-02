import * as fs from 'fs';
import * as path from 'path';

export type TestResultStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_IMPLEMENTED' | 'NOT_APPLICABLE';

export interface AuditTestEntry {
  id: string;
  role: 'Administrador' | 'Recepcionista' | 'Técnico' | 'Cliente' | 'General' | 'Seguridad';
  module: string;
  scenario: string;
  status: TestResultStatus;
  expected: string;
  actual: string;
  evidence: string;
  durationMs: number;
  severity?: 'CRÍTICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  fileOrService?: string;
  recommendation?: string;
}

export class AuditReporter {
  private results: AuditTestEntry[] = [];
  private startTime: number = Date.now();

  record(entry: Omit<AuditTestEntry, 'durationMs'> & { durationMs?: number }) {
    const finalEntry: AuditTestEntry = {
      durationMs: entry.durationMs ?? 0,
      ...entry,
    };
    this.results.push(finalEntry);
    const symbol =
      finalEntry.status === 'PASS'
        ? '✓'
        : finalEntry.status === 'FAIL'
        ? '✗'
        : finalEntry.status === 'BLOCKED'
        ? '⊘'
        : '○';
    console.log(`  ${symbol} [${finalEntry.id}] [${finalEntry.status}] ${finalEntry.scenario} (${finalEntry.durationMs}ms)`);
    if (finalEntry.status === 'FAIL') {
      console.log(`     -> Expected: ${finalEntry.expected}`);
      console.log(`     -> Actual:   ${finalEntry.actual}`);
      console.log(`     -> Evidence: ${finalEntry.evidence}`);
    }
  }

  getResults(): AuditTestEntry[] {
    return this.results;
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.status === 'PASS').length;
    const failed = this.results.filter((r) => r.status === 'FAIL').length;
    const blocked = this.results.filter((r) => r.status === 'BLOCKED').length;
    const notImplemented = this.results.filter((r) => r.status === 'NOT_IMPLEMENTED').length;
    const notApplicable = this.results.filter((r) => r.status === 'NOT_APPLICABLE').length;
    const totalDurationMs = Date.now() - this.startTime;

    return {
      total,
      passed,
      failed,
      blocked,
      notImplemented,
      notApplicable,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0%',
      totalDurationMs,
    };
  }

  saveReport(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: this.getSummary(),
      results: this.results,
    };
    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2), 'utf-8');
    console.log(`\n✓ Audit report JSON saved to: ${filePath}`);
  }
}
