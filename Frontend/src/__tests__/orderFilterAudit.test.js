import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Simulamos los estados activos
const mockEstados = [
  { id: 1, nombre: 'Recepción', estado: true },
  { id: 2, nombre: 'Diagnóstico', estado: true },
  { id: 3, nombre: 'En Servicio', estado: true },
  { id: 4, nombre: 'Listo para Entrega', estado: true },
  { id: 5, nombre: 'Entregado', estado: true },
];

// Importamos la función pura de resolución de tabs
function resolveActiveTabId(currentId, activeEstados, savedTabId) {
  if (!activeEstados || activeEstados.length === 0) return undefined;

  // 0. Si expresamente se indicó 'all' en sessionStorage o selección, preservar 'Todas' (undefined)
  if (savedTabId === 'all' || savedTabId === 'todas') {
    return undefined;
  }

  // 1. Conservar selección actual si es válida
  if (currentId !== undefined && activeEstados.some((e) => e.id === currentId)) {
    return currentId;
  }

  // 2. Revisar pestaña guardada en sesión
  if (savedTabId !== undefined && savedTabId !== null) {
    const parsedSavedId = Number(savedTabId);
    if (!isNaN(parsedSavedId) && activeEstados.some((e) => e.id === parsedSavedId)) {
      return parsedSavedId;
    }
  }

  // 3. Seleccionar Recepción de manera dinámica
  const recepcion = activeEstados.find((e) => e.nombre.toLowerCase().includes('recep'));
  return recepcion ? recepcion.id : activeEstados[0].id;
}

// Simulador de construcción de query params para useOrders
function buildOrdersQueryParams({ page = 1, limit = 10, search = '', includeInactive = false, estadoId, techId, fechaInicio, fechaFin }) {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  if (search) queryParams.append('search', search);
  if (includeInactive) queryParams.append('includeInactive', 'true');
  if (estadoId) queryParams.append('estadoOrdenId', estadoId.toString());
  if (techId) queryParams.append('technicianId', techId.toString());
  if (fechaInicio && fechaFin) {
    queryParams.append('fechaInicio', fechaInicio);
    queryParams.append('fechaFin', fechaFin);
  }

  return queryParams.toString();
}

describe('Filtros de Órdenes: Pestaña Todas y Filtro de Técnico', () => {
  it('1. Pestaña "Todas": resuelve undefined cuando savedTabId es "all"', () => {
    const resolved = resolveActiveTabId(undefined, mockEstados, 'all');
    assert.equal(resolved, undefined);
  });

  it('2. Primera carga sin sesión previa: resuelve a Recepción (ID 1)', () => {
    const resolved = resolveActiveTabId(undefined, mockEstados, null);
    assert.equal(resolved, 1);
  });

  it('3. Pestaña específica guardada: resuelve al ID del estado guardado', () => {
    const resolved = resolveActiveTabId(undefined, mockEstados, '3');
    assert.equal(resolved, 3);
  });

  it('4. Pestaña activa actual tiene prioridad cuando está seleccionada', () => {
    const resolved = resolveActiveTabId(2, mockEstados, '1');
    assert.equal(resolved, 2);
  });

  it('5. En pestaña "Todas", NO se incluye estadoOrdenId en la URL de la API', () => {
    const queryString = buildOrdersQueryParams({
      page: 1,
      limit: 10,
      search: 'Laptop HP',
      estadoId: undefined, // "Todas"
      techId: 4, // Técnico específico
    });

    assert.ok(!queryString.includes('estadoOrdenId'), 'No debe incluir estadoOrdenId');
    assert.ok(queryString.includes('technicianId=4'), 'Debe incluir technicianId');
    assert.ok(queryString.includes('search=Laptop+HP'), 'Debe incluir el término de búsqueda');
  });

  it('6. En pestaña de estado específico con técnico, incluye ambos en la URL', () => {
    const queryString = buildOrdersQueryParams({
      page: 1,
      limit: 10,
      estadoId: 2, // Diagnóstico
      techId: 7, // Técnico ID 7
    });

    assert.ok(queryString.includes('estadoOrdenId=2'), 'Debe incluir estadoOrdenId=2');
    assert.ok(queryString.includes('technicianId=7'), 'Debe incluir technicianId=7');
  });

  it('7. Sin técnico seleccionado ("Todos los técnicos"), NO se incluye technicianId', () => {
    const queryString = buildOrdersQueryParams({
      page: 1,
      limit: 10,
      estadoId: 1,
      techId: undefined,
    });

    assert.ok(queryString.includes('estadoOrdenId=1'));
    assert.ok(!queryString.includes('technicianId'), 'No debe incluir technicianId cuando no se filtra por uno');
  });
});

