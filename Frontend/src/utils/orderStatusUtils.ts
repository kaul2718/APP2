import { apiRequest } from '../lib/api';
import type { EstadoOrden } from '../hooks/useEstadoOrden';

/**
 * Normaliza una cadena de texto eliminando acentos/diacríticos y espacios extras.
 */
export function normalizeStatusName(name: string): string {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Determina si un estado corresponde a la fase de Recepción,
 * independientemente de mayúsculas, acentos o prefijos/sufijos.
 */
export function isRecepcionStatus(estado: { nombre: string }): boolean {
  if (!estado?.nombre) return false;
  return normalizeStatusName(estado.nombre).includes('recepci');
}

/**
 * Encuentra el estado de Recepción dentro de una lista de estados activos.
 * Si no encuentra una coincidencia con "recepci", recurre al primer elemento activo.
 */
export function findRecepcionStatus<T extends { nombre: string; estado?: boolean }>(
  estados: T[]
): T | undefined {
  if (!Array.isArray(estados) || estados.length === 0) return undefined;
  const activeList = estados.filter((e) => e.estado !== false);
  const matched = activeList.find((e) => isRecepcionStatus(e));
  return matched || activeList[0] || estados[0];
}

/**
 * Asigna una prioridad numérica a cada estado según el flujo de negocio:
 * 0: Recepción
 * 1: Diagnóstico
 * 2: Presupuestado / Presupuesto
 * 3: Aprobado / Aprobación
 * 4: En Reparación / Reparación
 * 5: Esperando Repuesto / Repuestos
 * 6: Control de Calidad / Control
 * 7: Listo para Entrega / Entrega / Entregado
 * 8: Archivados
 * 9: Anulado
 * 99: Otros no catalogados
 */
export function getStatusWorkflowPriority(nombre: string): number {
  const norm = normalizeStatusName(nombre);

  if (norm.includes('recepci')) return 0;
  if (norm.includes('diagno')) return 1;
  if (norm.includes('presupuest')) return 2;
  if (norm.includes('aprob')) return 3;
  if (norm.includes('repara')) return 4;
  if (norm.includes('repuesto')) return 5;
  if (norm.includes('control') || norm.includes('calidad')) return 6;
  if (norm.includes('entrega')) return 7;
  if (norm.includes('archiv')) return 8;
  if (norm.includes('anulad')) return 9;

  return 99;
}

/**
 * Ordena los estados de orden según el flujo funcional de trabajo.
 * Estados con la misma prioridad se ordenan alfabéticamente.
 */
export function sortEstadosOrden<T extends { nombre: string }>(estados: T[]): T[] {
  if (!Array.isArray(estados)) return [];
  return [...estados].sort((a, b) => {
    const aPriority = getStatusWorkflowPriority(a.nombre);
    const bPriority = getStatusWorkflowPriority(b.nombre);
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    return a.nombre.localeCompare(b.nombre);
  });
}

/**
 * Resuelve el ID del estado a seleccionar en la vista de órdenes respetando:
 * 1. El estado actual si aún es válido dentro de los activos.
 * 2. El último estado almacenado en sessionStorage si es válido.
 * 3. El estado dinámico de "Recepción" obtenido del catálogo.
 */
export function resolveActiveTabId<T extends { id: number; nombre: string; estado?: boolean }>(
  currentId: number | undefined,
  activeEstados: T[],
  savedTabId?: string | number | null
): number | undefined {
  if (!activeEstados || activeEstados.length === 0) return undefined;

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
  const recepcion = findRecepcionStatus(activeEstados);
  return recepcion ? recepcion.id : activeEstados[0].id;
}

/**
 * Recupera el catálogo completo de estados de orden desde la API.
 * - Intenta primero el endpoint no paginado GET /estados-orden.
 * - Si la API retorna un objeto paginado o si falla y se recurre a /estados-orden/all,
 *   recupera todas las páginas exhaustivamente sin recurrir a límites arbitrarios.
 */
export async function fetchCompleteEstadoOrdenCatalog(
  session: any,
  includeInactive: boolean = false
): Promise<EstadoOrden[]> {
  if (!session?.accessToken) return [];

  // Intento 1: Endpoint no paginado GET /estados-orden
  try {
    const query = includeInactive ? '?includeInactive=true' : '';
    const res = await apiRequest<EstadoOrden[] | { items: EstadoOrden[]; totalPages: number }>(
      `/estados-orden${query}`,
      {},
      session
    );

    // Contrato estándar: array de EstadoOrden
    if (Array.isArray(res)) {
      return res;
    }

    // Si respondiese con objeto paginado { items, totalPages }
    if (res && Array.isArray((res as any).items)) {
      let allItems = [...(res as any).items];
      const totalPages = (res as any).totalPages || 1;
      for (let p = 2; p <= totalPages; p++) {
        const nextRes = await apiRequest<{ items: EstadoOrden[] }>(
          `/estados-orden?page=${p}${includeInactive ? '&includeInactive=true' : ''}`,
          {},
          session
        );
        if (nextRes?.items && Array.isArray(nextRes.items)) {
          allItems = allItems.concat(nextRes.items);
        }
      }
      return allItems;
    }
  } catch (error) {
    console.warn(
      'Endpoint no paginado /estados-orden falló o no está disponible. Recurriendo a fallback exhaustivo:',
      error
    );
  }

  // Intento 2: Fallback exhaustivo página por página desde /estados-orden/all
  try {
    const firstPage = await apiRequest<{ items: EstadoOrden[]; totalPages: number }>(
      `/estados-orden/all?page=1&limit=10${includeInactive ? '&includeInactive=true' : ''}`,
      {},
      session
    );

    if (firstPage && Array.isArray(firstPage.items)) {
      let allItems = [...firstPage.items];
      const pages = firstPage.totalPages || 1;
      for (let p = 2; p <= pages; p++) {
        const pageRes = await apiRequest<{ items: EstadoOrden[] }>(
          `/estados-orden/all?page=${p}&limit=10${includeInactive ? '&includeInactive=true' : ''}`,
          {},
          session
        );
        if (pageRes?.items && Array.isArray(pageRes.items)) {
          allItems = allItems.concat(pageRes.items);
        }
      }
      return allItems;
    }
  } catch (fallbackError) {
    console.error('Error al recuperar todas las páginas de estados de orden:', fallbackError);
    throw fallbackError;
  }

  return [];
}
