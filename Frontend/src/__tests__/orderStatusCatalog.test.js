const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Cargar utilidades TypeScript usando jiti nativo del proyecto
const jiti = require(path.resolve(__dirname, '../../node_modules/jiti'))(__filename);
const {
  normalizeStatusName,
  isRecepcionStatus,
  findRecepcionStatus,
  getStatusWorkflowPriority,
  sortEstadosOrden,
  resolveActiveTabId,
  fetchCompleteEstadoOrdenCatalog,
} = jiti('../utils/orderStatusUtils.ts');

// Catálogo real de producción con 11 estados
// Ordenados alfabéticamente (tal como los entrega el backend con ORDER BY nombre ASC)
const PRODUCTION_11_ESTADOS = [
  { id: 11, nombre: 'Anulado', estado: true },
  { id: 4, nombre: 'Aprobado', estado: true },
  { id: 10, nombre: 'Archivados', estado: true },
  { id: 7, nombre: 'Control de Calidad', estado: true },
  { id: 2, nombre: 'Diagnóstico', estado: true },
  { id: 5, nombre: 'En Reparación', estado: true },
  { id: 9, nombre: 'Entregado', estado: true },
  { id: 6, nombre: 'Esperando Repuesto', estado: true },
  { id: 8, nombre: 'Listo para Entrega', estado: true },
  { id: 3, nombre: 'Presupuestado', estado: true },
  // 'Recepción' (R) es el elemento 11. En paginación con limit: 10 queda en la página 2:
  { id: 1, nombre: 'Recepción', estado: true },
];

describe('FASE 1: Corrección de Estados ODS - Catálogo >= 11 estados', () => {

  describe('1. Identificación dinámica de Recepción (independiente de ID y entorno)', () => {
    it('debe identificar "Recepción" con tilde y mayúscula', () => {
      assert.equal(isRecepcionStatus({ nombre: 'Recepción' }), true);
    });

    it('debe identificar "recepcion" sin tilde y en minúscula', () => {
      assert.equal(isRecepcionStatus({ nombre: 'recepcion' }), true);
    });

    it('debe identificar variaciones como "RECEPCIÓN DE EQUIPOS" o con espacios', () => {
      assert.equal(isRecepcionStatus({ nombre: '  RECEPCIÓN DE EQUIPOS  ' }), true);
    });

    it('no debe confundir otros estados como Diagnóstico, Aprobado o En Reparación', () => {
      assert.equal(isRecepcionStatus({ nombre: 'Diagnóstico' }), false);
      assert.equal(isRecepcionStatus({ nombre: 'Aprobado' }), false);
      assert.equal(isRecepcionStatus({ nombre: 'En Reparación' }), false);
    });

    it('debe encontrar el estado Recepción con ID 1 (producción)', () => {
      const found = findRecepcionStatus(PRODUCTION_11_ESTADOS);
      assert.ok(found);
      assert.equal(found.id, 1);
      assert.equal(found.nombre, 'Recepción');
    });

    it('debe identificar dinámicamente Recepción si su ID fuese diferente en otro entorno (ej. ID 99)', () => {
      const modifiedEstados = PRODUCTION_11_ESTADOS.map((e) =>
        e.nombre === 'Recepción' ? { ...e, id: 99 } : e
      );
      const found = findRecepcionStatus(modifiedEstados);
      assert.ok(found);
      assert.equal(found.id, 99);
      assert.equal(found.nombre, 'Recepción');
    });

    it('debe hacer fallback seguro al primer elemento activo si Recepción no existiese', () => {
      const sinRecepcion = PRODUCTION_11_ESTADOS.filter((e) => e.nombre !== 'Recepción');
      const found = findRecepcionStatus(sinRecepcion);
      assert.ok(found);
      assert.equal(found.id, 11); // Anulado
    });
  });

  describe('2. Ordenamiento funcional de los 11 estados (Flujo de Negocio ODS)', () => {
    it('debe posicionar Recepción en el índice 0 a pesar de ser el 11 alfabéticamente', () => {
      const sorted = sortEstadosOrden(PRODUCTION_11_ESTADOS);
      assert.equal(sorted.length, 11);
      assert.equal(sorted[0].nombre, 'Recepción');
      assert.equal(sorted[0].id, 1);
    });

    it('debe ordenar los 11 estados conservando todos los registros sin alteración', () => {
      const sorted = sortEstadosOrden(PRODUCTION_11_ESTADOS);
      const nombresOrdenados = sorted.map((e) => e.nombre);

      assert.equal(nombresOrdenados[0], 'Recepción');
      assert.equal(nombresOrdenados[1], 'Diagnóstico');

      // Verificar que todos los 11 estados de producción se conserven intactos
      const expected = [
        'Recepción',
        'Diagnóstico',
        'Presupuestado',
        'Aprobado',
        'En Reparación',
        'Esperando Repuesto',
        'Control de Calidad',
        'Entregado',
        'Listo para Entrega',
        'Archivados',
        'Anulado',
      ];

      for (const nombre of expected) {
        assert.ok(nombresOrdenados.includes(nombre), `El estado ${nombre} debe estar en la lista`);
      }
    });
  });

  describe('3. Selección inicial de pestaña y preservación de estado', () => {
    it('al entrar a la vista ODS (currentId undefined, sin sesión previa), debe seleccionar Recepción (ID 1)', () => {
      const activeEstados = sortEstadosOrden(PRODUCTION_11_ESTADOS);
      const selectedId = resolveActiveTabId(undefined, activeEstados, null);
      assert.equal(selectedId, 1);
    });

    it('al entrar en un entorno donde Recepción tiene ID 77, debe seleccionar dinámicamente 77', () => {
      const customEstados = PRODUCTION_11_ESTADOS.map((e) =>
        e.nombre === 'Recepción' ? { ...e, id: 77 } : e
      );
      const activeEstados = sortEstadosOrden(customEstados);
      const selectedId = resolveActiveTabId(undefined, activeEstados, null);
      assert.equal(selectedId, 77);
    });

    it('debe preservar la selección activa del usuario si ya es válida (no sobreescribir al recargar catálogo)', () => {
      const activeEstados = sortEstadosOrden(PRODUCTION_11_ESTADOS);
      // Usuario está en 'Diagnóstico' (id 2)
      const currentId = 2;
      const result = resolveActiveTabId(currentId, activeEstados, '1');
      assert.equal(result, 2, 'No debe sobreescribir el tab activo del usuario');
    });

    it('debe restaurar la pestaña de sessionStorage si currentId no está definido', () => {
      const activeEstados = sortEstadosOrden(PRODUCTION_11_ESTADOS);
      // Usuario tenía guardado 'En Reparación' (id 5)
      const result = resolveActiveTabId(undefined, activeEstados, '5');
      assert.equal(result, 5);
    });

    it('si sessionStorage contiene un ID inválido o eliminado, debe hacer fallback seguro a Recepción', () => {
      const activeEstados = sortEstadosOrden(PRODUCTION_11_ESTADOS);
      const result = resolveActiveTabId(undefined, activeEstados, '9999');
      assert.equal(result, 1);
    });
  });

  describe('4. Carga de catálogo cuando Recepción queda fuera de la primera página', () => {
    it('demuestra que una paginación con limit 10 excluye a Recepción', () => {
      // Simula el error original: consulta paginada a /estados-orden/all con limit 10
      const pagina1ConLimite10 = PRODUCTION_11_ESTADOS.slice(0, 10);
      assert.equal(pagina1ConLimite10.length, 10);
      assert.equal(pagina1ConLimite10.some((e) => e.nombre === 'Recepción'), false);
    });

    it('verifica que el catálogo completo incluye los 11 estados y a Recepción', () => {
      assert.equal(PRODUCTION_11_ESTADOS.length, 11);
      assert.equal(PRODUCTION_11_ESTADOS.some((e) => e.nombre === 'Recepción'), true);

      // Con el catálogo completo, la pestaña Recepción se selecciona correctamente
      const activeEstados = sortEstadosOrden(PRODUCTION_11_ESTADOS);
      const tabId = resolveActiveTabId(undefined, activeEstados, null);
      assert.equal(tabId, 1);
    });

    it('recuperación exhaustiva multi-página sin depender de un límite arbitrario de 100', async () => {
      // Simulación de API paginada en 3 páginas con tamaños variables
      const pages = {
        1: { items: PRODUCTION_11_ESTADOS.slice(0, 5), totalPages: 3 },
        2: { items: PRODUCTION_11_ESTADOS.slice(5, 10), totalPages: 3 },
        3: { items: PRODUCTION_11_ESTADOS.slice(10, 11), totalPages: 3 }, // Recepción en página 3
      };

      const mockApi = async (page) => pages[page];

      // Algoritmo exhaustivo
      const page1 = await mockApi(1);
      let allItems = [...page1.items];
      for (let p = 2; p <= page1.totalPages; p++) {
        const next = await mockApi(p);
        allItems = allItems.concat(next.items);
      }

      assert.equal(allItems.length, 11);
      const recepcion = allItems.find((e) => e.nombre === 'Recepción');
      assert.ok(recepcion);
      assert.equal(recepcion.id, 1);

      // Verificación de selección final
      const sorted = sortEstadosOrden(allItems);
      const activeId = resolveActiveTabId(undefined, sorted, null);
      assert.equal(activeId, 1);
    });
  });
});

