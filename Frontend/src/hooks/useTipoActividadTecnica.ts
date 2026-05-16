'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";

export interface ActividadTecnica {
  id: number;
  nombre: string;
}

export interface TipoActividadTecnica {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  actividades?: ActividadTecnica[];
}

interface CreateTipoActividadDto {
  nombre: string;
  descripcion?: string;
}

interface UpdateTipoActividadDto {
  nombre?: string;
  descripcion?: string;
  estado?: boolean;
}

export function useTipoActividadTecnica() {
  const { data: session, status } = useSession();
  const {
    items: tipos,
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
    setItems: setTipos,
    setSearchTerm,
    setShowInactive,
  } = useCrud<TipoActividadTecnica, CreateTipoActividadDto, UpdateTipoActividadDto>(
    '/tipos-actividad-tecnica',
    {
      defaultLimit: 10,
      listPath: '/tipos-actividad-tecnica/all',
      messages: {
        created: 'Tipo de actividad tecnica creado exitosamente',
        updated: 'Tipo de actividad tecnica actualizado exitosamente',
        deleted: 'Tipo de actividad tecnica eliminado exitosamente',
        restored: 'Tipo de actividad tecnica restaurado exitosamente',
        toggled: (enabled) =>
          `Tipo de actividad tecnica ${enabled ? 'activado' : 'desactivado'} exitosamente`,
        loadError: 'Error al cargar tipos de actividad tecnica',
        createError: 'Error al crear tipo de actividad tecnica',
        updateError: 'Error al actualizar tipo de actividad tecnica',
        deleteError: 'Error al eliminar tipo de actividad tecnica',
        restoreError: 'Error al restaurar tipo de actividad tecnica',
        toggleError: 'Error al cambiar estado del tipo de actividad tecnica',
      },
    },
  );

  const fetchTipos = fetchItems;
  const createTipoActividad = createItem;
  const updateTipoActividad = updateItem;
  const toggleTipoActividadStatus = toggleItemStatus;
  const deleteTipoActividad = deleteItem;
  const restoreTipoActividad = restoreItem;

  const fetchAllTipos = async (includeInactive: boolean = false) => {
    try {
      return await apiRequest<TipoActividadTecnica[]>(
        `/tipos-actividad-tecnica?includeInactive=${includeInactive}`,
        {},
        session,
      );
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchTipos(1, 10, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    tipos,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchTipos,
    createTipoActividad,
    updateTipoActividad,
    toggleTipoActividadStatus,
    deleteTipoActividad,
    restoreTipoActividad,
    fetchAllTipos,
    setTipos,
    setSearchTerm,
    setShowInactive,
  };
}