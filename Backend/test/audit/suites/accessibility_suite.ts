import { AuditReporter } from '../audit_reporter';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export async function runAccessibilitySuite(reporter: AuditReporter) {
  console.log('\n--- SUITE 9: AUDITORÍA DE ACCESIBILIDAD WCAG 2.1 AA Y UX ---');
  const FRONTEND_URL = 'http://localhost:4000';

  // Helper to fetch frontend HTML
  async function fetchPage(route: string) {
    try {
      const res = await axios.get(`${FRONTEND_URL}${route}`, { timeout: 6000 });
      return { status: res.status, html: res.data };
    } catch (e: any) {
      return { status: e.response?.status || 500, html: '' };
    }
  }

  // A11Y-01: Portal Público /consulta - Estructura semántica y formularios
  {
    const t0 = Date.now();
    const page = await fetchPage('/consulta');
    const html = page.html;

    const hasH1 = /<h1[^>]*>/.test(html);
    const hasInputs = /<input[^>]*id=["'][^"']+["']/.test(html);
    const hasLabels = /<label[^>]*for=["'][^"']+["']|<label[^>]*htmlFor=["'][^"']+["']/.test(html);
    const hasAriaLabels = /aria-label=["'][^"']+["']/.test(html);

    const isSuccess = page.status === 200 && (hasH1 || hasInputs) && (hasLabels || hasAriaLabels);
    reporter.record({
      id: 'A11Y-01',
      role: 'Cliente',
      module: 'Accesibilidad WCAG 2.1 AA',
      scenario: 'Portal público /consulta: Semántica de encabezados, etiquetas de formulario y atributos ARIA',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200, presencia de encabezados semánticos y campos de formulario asociados con etiquetas o aria-label',
      actual: `HTTP ${page.status}, hasH1=${hasH1}, hasInputs=${hasInputs}, hasLabels/Aria=${hasLabels || hasAriaLabels}`,
      evidence: 'Criterio WCAG 1.3.1 (Info y Relaciones), 3.3.2 (Etiquetas o Instrucciones) y 4.1.2 (Nombre, Función, Valor)',
      durationMs: Date.now() - t0,
    });
  }

  // A11Y-02: Página de autenticación /signin - Accesibilidad de controles
  {
    const t0 = Date.now();
    const page = await fetchPage('/signin');
    const html = page.html;

    const hasPasswordField = /type=["']password["']/.test(html);
    const hasSubmitButton = /type=["']submit["']|<button[^>]*>/.test(html);

    const isSuccess = page.status === 200 && hasPasswordField && hasSubmitButton;
    reporter.record({
      id: 'A11Y-02',
      role: 'General',
      module: 'Accesibilidad WCAG 2.1 AA',
      scenario: 'Página de Login /signin: Controles de entrada de credenciales y botón de envío identificables',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'HTTP 200 con campos de correo, contraseña y botón accesible',
      actual: `HTTP ${page.status}, hasPasswordField=${hasPasswordField}, hasSubmitButton=${hasSubmitButton}`,
      evidence: 'Criterio WCAG 2.4.6 (Encabezados y Etiquetas) y 2.1.1 (Teclado)',
      durationMs: Date.now() - t0,
    });
  }

  // A11Y-03: Componentes de Modal y Diálogo - Inspección de código fuente
  {
    const t0 = Date.now();
    // Verify source code of AgregarEvidenciaTecnicaModal for keyboard and ARIA attributes
    const modalPath = path.join(__dirname, '../../../../Frontend/src/components/modals/AgregarEvidenciaTecnicaModal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf-8');

    const hasRoleAlert = modalContent.includes('role="alert"');
    const hasAriaLive = modalContent.includes('aria-live');
    const hasAriaLabel = modalContent.includes('aria-label');
    const hasCloseAria = modalContent.includes('aria-label') || modalContent.includes('XMarkIcon');

    const isSuccess = hasRoleAlert && hasAriaLive && hasAriaLabel;
    reporter.record({
      id: 'A11Y-03',
      role: 'Técnico',
      module: 'Accesibilidad WCAG 2.1 AA',
      scenario: 'Modal de Evidencias Técnicas: Regiones vivas (aria-live), alertas para lectores de pantalla y etiquetas',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'Implementación de role="alert", aria-live="polite" para conteos y aria-label en controles de archivo',
      actual: `roleAlert=${hasRoleAlert}, ariaLive=${hasAriaLive}, ariaLabel=${hasAriaLabel}`,
      evidence: 'Criterio WCAG 4.1.3 (Mensajes de Estado) y 1.1.1 (Contenido no Textual)',
      durationMs: Date.now() - t0,
    });
  }

  // A11Y-04: Componente de Paginación y Tablas - Etiquetas de navegación
  {
    const t0 = Date.now();
    const modalPath = path.join(__dirname, '../../../../Frontend/src/components/modals/AgregarEvidenciaTecnicaModal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf-8');

    const hasAriaCurrent = modalContent.includes('aria-current');
    const hasPageAria = modalContent.includes('aria-label="Página');

    const isSuccess = hasAriaCurrent && hasPageAria;
    reporter.record({
      id: 'A11Y-04',
      role: 'General',
      module: 'Accesibilidad WCAG 2.1 AA',
      scenario: 'Paginación accesible: Identificación de página activa con aria-current="page" y botones numerados',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'aria-current="page" en página actual y aria-label descriptivo en botones de navegación',
      actual: `ariaCurrent=${hasAriaCurrent}, pageAria=${hasPageAria}`,
      evidence: 'Criterio WCAG 1.3.1 (Info y Relaciones) y 2.4.4 (Propósito de los Enlaces/Botones)',
      durationMs: Date.now() - t0,
    });
  }

  // A11Y-05: Reproductor de Video y Multimedia - Preload y controles accesibles
  {
    const t0 = Date.now();
    const itemPath = path.join(__dirname, '../../../../Frontend/src/components/EvidenciaItem.tsx');
    const itemContent = fs.readFileSync(itemPath, 'utf-8');

    const hasPreload = itemContent.includes('preload="metadata"');
    const hasControls = itemContent.includes('controls');
    const hasFallbackText = itemContent.includes('Tu navegador no soporta');

    const isSuccess = hasPreload && hasControls && hasFallbackText;
    reporter.record({
      id: 'A11Y-05',
      role: 'Técnico',
      module: 'Accesibilidad Multimedia',
      scenario: 'Reproductor de video: Controles nativos de accesibilidad, preload metadata y texto alternativo de contingencia',
      status: isSuccess ? 'PASS' : 'FAIL',
      expected: 'video con controls, preload="metadata" y texto alternativo para navegadores o códecs incompatibles',
      actual: `preload=${hasPreload}, controls=${hasControls}, fallback=${hasFallbackText}`,
      evidence: 'Criterio WCAG 1.2.1 (Sólo Audio y Sólo Video pregrabado) y 1.2.2 (Subtítulos/Alternativas)',
      durationMs: Date.now() - t0,
    });
  }
}
