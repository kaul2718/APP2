'use client';

import { useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";
import { fetchCompleteEstadoOrdenCatalog } from "@/utils/orderStatusUtils";

export interface EstadoOrden {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  ordenes?: Array<{ id: number }>;
  historialComoAnterior?: Array<{ id: number }>;
  historialComoNuevo?: Array<{ id: number }>;
}

interface CreateEstadoOrdenDto {
  nombre: string;
  descripcion?: string;
}

interface UpdateEstadoOrdenDto {
  nombre?: string;
  descripcion?: string;
  estado?: boolean;
}

export interface UseEstadoOrdenOptions {
  defaultLimit?: number;
  paginated?: boolean;
}

export function useEstadoOrden(options: UseEstadoOrdenOptions = {}) {
  const { data: session, status } = useSession();
  const isPaginatedMode = options.paginated === true;
  const defaultLimit = options.defaultLimit || 10;

  const {
    items: estadosOrden,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchItems,
    createItem,
    updateItem,
    toggleItemStatus,
    deleteItem,
    restoreItem,
    setItems: setEstadosOrden,
    setSearchTerm,
    setShowInactive,
  } = useCrud<EstadoOrden, CreateEstadoOrdenDto, UpdateEstadoOrdenDto>('/estados-orden', {
    defaultLimit,
    listPath: '/estados-orden/all',
    messages: {
      created: 'Estado de orden creado exitosamente',
      updated: 'Estado de orden actualizado exitosamente',
      deleted: 'Estado de orden eliminado exitosamente',
      restored: 'Estado de orden restaurado exitosamente',
      toggled: (enabled) =>
        `Estado de orden ${enabled ? 'activado' : 'desactivado'} exitosamente`,
      loadError: 'Error al cargar estados de orden',
      createError: 'Error al crear estado de orden',
      updateError: 'Error al actualizar estado de orden',
      deleteError: 'Error al eliminar estado de orden',
      restoreError: 'Error al restaurar estado de orden',
      toggleError: 'Error al cambiar estado del estado de orden',
    },
  });

  const loadCompleteCatalog = useCallback(
    async (includeInactive: boolean = false): Promise<EstadoOrden[]> => {
      if (!session?.accessToken) return [];
      try {
        const fullList = await fetchCompleteEstadoOrdenCatalog(session, includeInactive);
        if (Array.isArray(fullList) && fullList.length > 0) {
          setEstadosOrden(fullList);
        }
        return fullList;
      } catch (error) {
        console.error("Error al cargar catálogo completo de estados de orden:", error);
        return [];
      }
    },
    [session, setEstadosOrden]
  );

  const fetchEstadosOrden = useCallback(
    async (
      page?: number,
      limit?: number,
      search?: string,
      includeInactive?: boolean,
      extraFilters?: Record<string, string | number | boolean | undefined | null>,
      listPathOverride?: string,
    ) => {
      // Si no se especifica paginación ni búsqueda y no está forzado el modo paginado,
      // cargamos el catálogo completo.
      if (page === undefined && limit === undefined && !search && !isPaginatedMode) {
        await loadCompleteCatalog(includeInactive ?? showInactive);
        return;
      }

      await fetchItems(page, limit, search, includeInactive, extraFilters, listPathOverride);
    },
    [fetchItems, isPaginatedMode, loadCompleteCatalog, showInactive]
  );

  const createEstadoOrden = createItem;
  const updateEstadoOrden = updateItem;
  const toggleEstadoOrdenStatus = toggleItemStatus;
  const deleteEstadoOrden = deleteItem;
  const restoreEstadoOrden = restoreItem;

  const getEstadoOrdenById = async (id: number, includeInactive: boolean = false) => {
    try {
      return await apiRequest<EstadoOrden>(
        `/estados-orden/${id}?includeInactive=${includeInactive}`,
        {},
        session,
      );
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      if (isPaginatedMode || searchTerm) {
        fetchItems(1, defaultLimit, searchTerm, showInactive);
      } else {
        loadCompleteCatalog(showInactive);
      }
    }
  }, [status, session, searchTerm, showInactive, isPaginatedMode, defaultLimit, fetchItems, loadCompleteCatalog]);

  return {
    estadosOrden,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchEstadosOrden,
    loadCompleteCatalog,
    createEstadoOrden,
    updateEstadoOrden,
    toggleEstadoOrdenStatus,
    deleteEstadoOrden,
    restoreEstadoOrden,
    getEstadoOrdenById,
    setEstadosOrden,
    setSearchTerm,
    setShowInactive,
  };
}
