'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";

export interface MarcaModelo {
  id: number;
  nombre: string;
}

export interface EquipoModelo {
  id: number;
  nombre: string;
}

export interface Modelo {
  id: number;
  nombre: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  marca: MarcaModelo | null;  // Cambiado a null
  equipos?: EquipoModelo[];
}

interface CreateModeloDto {
  nombre: string;
  marcaId: number;
}

interface UpdateModeloDto {
  nombre?: string;
  marcaId?: number;
  estado?: boolean;
}

export function useModelo() {
  const { status } = useSession();
  const {
    items: modelos,
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
    setItems: setModelos,
    setSearchTerm,
    setShowInactive,
  } = useCrud<Modelo, CreateModeloDto, UpdateModeloDto>('/modelos', {
    defaultLimit: 1000,
    listPath: '/modelos/all',
    messages: {
      created: 'Modelo creado exitosamente',
      updated: 'Modelo actualizado exitosamente',
      deleted: 'Modelo eliminado exitosamente',
      restored: 'Modelo restaurado exitosamente',
      toggled: (enabled) => `Modelo ${enabled ? 'activado' : 'desactivado'} exitosamente`,
      loadError: 'Error al cargar modelos',
      createError: 'Error al crear modelo',
      updateError: 'Error al actualizar modelo',
      deleteError: 'Error al eliminar modelo',
      restoreError: 'Error al restaurar modelo',
      toggleError: 'Error al cambiar estado del modelo',
    },
  });

  const fetchModelos = fetchItems;
  const createModelo = createItem;
  const updateModelo = updateItem;
  const toggleModeloStatus = toggleItemStatus;
  const deleteModelo = deleteItem;
  const restoreModelo = restoreItem;

  useEffect(() => {
    if (status === "authenticated") {
      fetchModelos(1, 1000, searchTerm, showInactive);
    }
  }, [status, searchTerm, showInactive]);

  return {
    modelos,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchModelos,
    createModelo,
    updateModelo,
    toggleModeloStatus,
    deleteModelo,
    restoreModelo,
    setModelos,
    setSearchTerm,
    setShowInactive,
  };
}