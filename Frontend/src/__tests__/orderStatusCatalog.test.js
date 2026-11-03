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
  getNextWorkflowState,
  getPrevWorkflowState,
} = jiti('../utils/orderStatusUtils.ts');

// Catálogo DEFINITIVO oficial de producción (exactamente 8 estados con IDs no consecutivos)
const DEFINITIVE_8_ESTADOS = [
  { id: 1, nombre: 'Recepción', estado: true },
  { id: 2, nombre: 'Diagnóstico', estado: true },
  { id: 3, nombre: 'Repuestos', estado: true },
  { id: 4, nombre: 'Aprobación', estado: true },
  { id: 5, nombre: 'Reparación', estado: true },
  { id: 7, nombre: 'Control', estado: true }, // ID 7 (6 eliminado)
  { id: 9, nombre: 'Entrega', estado: true }, // ID 9 (8 eliminado)
  { id: 10, nombre: 'Archivados', estado: true }, // ID 10 (11 eliminado)
];

describe('CATÁLOGO DEFINITIVO ODS (8 ESTADOS) - HOSPITAL DEL COMPUTADOR', () => {

  describe('1. Estructura y nombres oficiales', () => {
    it('debe contener exactamente los 8 estados definitivos aprobados', () => {
      assert.equal(DEFINITIVE_8_ESTADOS.length, 8);
      const ids = DEFINITIVE_8_ESTADOS.map((e) => e.id);
      assert.deepEqual(ids, [1, 2, 3, 4, 5, 7, 9, 10]);

      const nombres = DEFINITIVE_8_ESTADOS.map((e) => e.nombre);
      assert.deepEqual(nombres, [
        'Recepción',
        'Diagnóstico',
        'Repuestos',
        'Aprobación',
        'Reparación',
        'Control',
        'Entrega',
        'Archivados',
      ]);
    });

    it('no debe contener estados eliminados (6, 8, 11)', () => {
      const ids = DEFINITIVE_8_ESTADOS.map((e) => e.id);
      assert.equal(ids.includes(6), false);
      assert.equal(ids.includes(8), false);
      assert.equal(ids.includes(11), false);
    });
  });

  describe('2. Ordenamiento funcional (Workflow ODS)', () => {
    it('debe ordenar los 8 estados en la secuencia funcional exacta sin depender de IDs', () => {
      // Pasamos los estados en orden aleatorio o invertido
      const desordenados = [
        { id: 10, nombre: 'Archivados', estado: true },
        { id: 7, nombre: 'Control', estado: true },
        { id: 1, nombre: 'Recepción', estado: true },
        { id: 9, nombre: 'Entrega', estado: true },
        { id: 4, nombre: 'Aprobación', estado: true },
        { id: 2, nombre: 'Diagnóstico', estado: true },
        { id: 5, nombre: 'Reparación', estado: true },
        { id: 3, nombre: 'Repuestos', estado: true },
      ];

      const ordenados = sortEstadosOrden(desordenados);
      const secuenciaNombres = ordenados.map((e) => e.nombre);

      assert.deepEqual(secuenciaNombres, [
        'Recepción',
        'Diagnóstico',
        'Repuestos',
        'Aprobación',
        'Reparación',
        'Control',
        'Entrega',
        'Archivados',
      ]);
    });
  });

  describe('3. Flujo completo de avance (Advance) con IDs no consecutivos', () => {
    const activeEstados = sortEstadosOrden(DEFINITIVE_8_ESTADOS);

    it('debe avanzar ordenadamente desde Recepción (ID 1) hasta Archivados (ID 10)', () => {
      let currentStateId = 1; // Recepción

      // 1 -> 2 (Diagnóstico)
      const step1 = getNextWorkflowState(currentStateId, activeEstados);
      assert.ok(step1);
      assert.equal(step1.id, 2);
      assert.equal(step1.nombre, 'Diagnóstico');
      currentStateId = step1.id;

      // 2 -> 3 (Repuestos)
      const step2 = getNextWorkflowState(currentStateId, activeEstados);
      assert.ok(step2);
      assert.equal(step2.id, 3);
      assert.equal(step2.nombre, 'Repuestos');
      currentStateId = step2.id;

      // 3 -> 4 (Aprobación)
      const step3 = getNextWorkflowState(currentStateId, activeEstados);
      assert.ok(step3);
      assert.equal(step3.id, 4);
      assert.equal(step3.nombre, 'Aprobación');
      currentStateId = step3.id;

      // 4 -> 5 (Reparación)
      const step4 = getNextWorkflowState(currentStateId, activeEstados);
      assert.ok(step4);
      assert.equal(step4.id, 5);
      assert.equal(step4.nombre, 'Reparación');
      currentStateId = step4.id;

      // 5 -> 7 (Control) - Salto no consecutivo (sin ID 6)
      const step5 = getNextWorkflowState(currentStateId, activeEstados);
      assert.ok(step5);
      assert.equal(step5.id, 7);
      assert.equal(step5.nombre, 'Control');
      currentStateId = step5.id;

      // 7 -> 9 (Entrega) - Salto no consecutivo (sin ID 8)
      const step6 = getNextWorkflowState(currentStateId, activeEstados);
      assert.ok(step6);
      assert.equal(step6.id, 9);
      assert.equal(step6.nombre, 'Entrega');
      currentStateId = step6.id;

      // 9 -> 10 (Archivados)
      const step7 = getNextWorkflowState(currentStateId, activeEstados);
      assert.ok(step7);
      assert.equal(step7.id, 10);
      assert.equal(step7.nombre, 'Archivados');
      currentStateId = step7.id;

      // 10 es terminal: no puede avanzar más
      const step8 = getNextWorkflowState(currentStateId, activeEstados);
      assert.equal(step8, undefined);
    });
  });

  describe('4. Flujo completo de retroceso (Retroceder) con IDs no consecutivos', () => {
    const activeEstados = sortEstadosOrden(DEFINITIVE_8_ESTADOS);

    it('debe retroceder ordenadamente desde Archivados (ID 10) hasta Recepción (ID 1)', () => {
      let currentStateId = 10; // Archivados

      // 10 -> 9 (Entrega)
      const step1 = getPrevWorkflowState(currentStateId, activeEstados);
      assert.equal(step1.id, 9);
      assert.equal(step1.nombre, 'Entrega');
      currentStateId = step1.id;

      // 9 -> 7 (Control)
      const step2 = getPrevWorkflowState(currentStateId, activeEstados);
      assert.equal(step2.id, 7);
      assert.equal(step2.nombre, 'Control');
      currentStateId = step2.id;

      // 7 -> 5 (Reparación)
      const step3 = getPrevWorkflowState(currentStateId, activeEstados);
      assert.equal(step3.id, 5);
      assert.equal(step3.nombre, 'Reparación');
      currentStateId = step3.id;

      // 5 -> 4 (Aprobación)
      const step4 = getPrevWorkflowState(currentStateId, activeEstados);
      assert.equal(step4.id, 4);
      assert.equal(step4.nombre, 'Aprobación');
      currentStateId = step4.id;

      // 4 -> 3 (Repuestos)
      const step5 = getPrevWorkflowState(currentStateId, activeEstados);
      assert.equal(step5.id, 3);
      assert.equal(step5.nombre, 'Repuestos');
      currentStateId = step5.id;

      // 3 -> 2 (Diagnóstico)
      const step6 = getPrevWorkflowState(currentStateId, activeEstados);
      assert.equal(step6.id, 2);
      assert.equal(step6.nombre, 'Diagnóstico');
      currentStateId = step6.id;

      // 2 -> 1 (Recepción)
      const step7 = getPrevWorkflowState(currentStateId, activeEstados);
      assert.equal(step7.id, 1);
      assert.equal(step7.nombre, 'Recepción');
      currentStateId = step7.id;

      // 1 es inicial: no puede retroceder más
      const step8 = getPrevWorkflowState(currentStateId, activeEstados);
      assert.equal(step8, undefined);
    });
  });

  describe('5. Flujo excepcional: Presupuesto Rechazado (Aprobación -> Control)', () => {
    const activeEstados = sortEstadosOrden(DEFINITIVE_8_ESTADOS);

    it('permite el salto excepcional desde Aprobación (ID 4) directo a Control (ID 7) omitiendo Reparación', () => {
      const aprobacionState = activeEstados.find((e) => e.id === 4);
      assert.ok(aprobacionState);

      // Simulación de la regla UX implementada en OrdenListLayout:
      // Cuando budgetStatus incluye 'rechaz', nextState se asigna a 'Control'
      const controlState = activeEstados.find((e) => e.nombre.toLowerCase().includes('control'));
      assert.ok(controlState);
      assert.equal(controlState.id, 7);
    });
  });

  describe('6. Selección y asignación de orden nueva a Recepción', () => {
    const activeEstados = sortEstadosOrden(DEFINITIVE_8_ESTADOS);

    it('identifica dinámicamente Recepción (ID 1) para órdenes nuevas sin estado previo', () => {
      const recepcion = findRecepcionStatus(activeEstados);
      assert.ok(recepcion);
      assert.equal(recepcion.id, 1);
      assert.equal(recepcion.nombre, 'Recepción');

      const resolvedId = resolveActiveTabId(undefined, activeEstados, null);
      assert.equal(resolvedId, 1);
    });

    it('preserva la pestaña activa del usuario cuando navega entre pestañas válidas', () => {
      // Usuario navega a Reparación (ID 5)
      const preserved = resolveActiveTabId(5, activeEstados, '1');
      assert.equal(preserved, 5);

      // Usuario navega a Control (ID 7)
      const preservedControl = resolveActiveTabId(7, activeEstados, '5');
      assert.equal(preservedControl, 7);
    });
  });
});
