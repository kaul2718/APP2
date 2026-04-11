'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";

export interface NotificacionTipo {
  id: number;
  nombre: string;
}

export interface TipoNotificacion {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notificaciones?: NotificacionTipo[];
}

interface CreateTipoNotificacionDto {
  nombre: string;
  descripcion?: string;
}

interface UpdateTipoNotificacionDto {
  nombre?: string;
  descripcion?: string;
  estado?: boolean;
}

export function useTipoNotificacion() {
  const { status } = useSession();
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
  } = useCrud<TipoNotificacion, CreateTipoNotificacionDto, UpdateTipoNotificacionDto>(
    '/tipos-notificacion',
    {
      defaultLimit: 10,
      messages: {
        created: 'Tipo de notificacion creado exitosamente',
        updated: 'Tipo de notificacion actualizado exitosamente',
        deleted: 'Tipo de notificacion eliminado exitosamente',
        restored: 'Tipo de notificacion restaurado exitosamente',
        toggled: (enabled) =>
          `Tipo de notificacion ${enabled ? 'activado' : 'desactivado'} exitosamente`,
        loadError: 'Error al cargar tipos de notificacion',
        createError: 'Error al crear tipo de notificacion',
        updateError: 'Error al actualizar tipo de notificacion',
        deleteError: 'Error al eliminar tipo de notificacion',
        restoreError: 'Error al restaurar tipo de notificacion',
        toggleError: 'Error al cambiar estado del tipo de notificacion',
      },
    },
  );

  const fetchTipos = fetchItems;
  const createTipo = createItem;
  const updateTipo = updateItem;
  const toggleTipoStatus = toggleItemStatus;
  const deleteTipo = deleteItem;
  const restoreTipo = restoreItem;

  useEffect(() => {
    if (status === "authenticated") {
      fetchTipos(1, 10, searchTerm, showInactive);
    }
  }, [status, searchTerm, showInactive]);

  return {
    tipos,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchTipos,
    createTipo,
    updateTipo,
    toggleTipoStatus,
    deleteTipo,
    restoreTipo,
    setTipos,
    setSearchTerm,
    setShowInactive,
  };
}