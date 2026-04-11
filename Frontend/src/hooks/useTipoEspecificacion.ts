'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";

export interface TipoEspecificacion {
  id: number;
  nombre: string;
  unidad: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateTipoEspecificacionDto {
  nombre: string;
  unidad: string;
}

interface UpdateTipoEspecificacionDto {
  nombre?: string;
  unidad?: string;
  estado?: boolean;
}

export function useTipoEspecificacion() {
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
  } = useCrud<TipoEspecificacion, CreateTipoEspecificacionDto, UpdateTipoEspecificacionDto>(
    '/tipo-especificacion',
    {
      defaultLimit: 10,
      listPath: '/all',
      messages: {
        created: 'Tipo de especificacion creado exitosamente',
        updated: 'Tipo de especificacion actualizado exitosamente',
        deleted: 'Tipo de especificacion eliminado exitosamente',
        restored: 'Tipo de especificacion restaurado exitosamente',
        toggled: (enabled) =>
          `Tipo de especificacion ${enabled ? 'activado' : 'desactivado'} exitosamente`,
        loadError: 'Error al cargar tipos de especificacion',
        createError: 'Error al crear tipo de especificacion',
        updateError: 'Error al actualizar tipo de especificacion',
        deleteError: 'Error al eliminar tipo de especificacion',
        restoreError: 'Error al restaurar tipo de especificacion',
        toggleError: 'Error al cambiar estado del tipo de especificacion',
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