'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";

export interface EstadoOrden {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  deletedAt: string | null;
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

export function useEstadoOrden() {
  const { data: session, status } = useSession();
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
    defaultLimit: 20,
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

  const fetchEstadosOrden = fetchItems;
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
      fetchEstadosOrden(1, 20, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    estadosOrden,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchEstadosOrden,
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