'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";

export interface CategoriaParte {
  id: number;
  nombre: string;
}

export interface MarcaParte {
  id: number;
  nombre: string;
}

export interface InventarioParte {
  id: number;
  cantidad: number;
}

export interface Parte {
  id: number;
  nombre: string;
  modelo: string;
  descripcion: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categoria: CategoriaParte | null;
  marca: MarcaParte | null;
  inventarios?: InventarioParte[];
  codigoInterno?: string;
  precioReferencia?: number;
}

interface CreateParteDto {
  nombre: string;
  modelo: string;
  descripcion: string;
  categoriaId: number;
  marcaId: number;
  codigoInterno?: string;
  precioReferencia?: number;
}

interface UpdateParteDto {
  nombre?: string;
  modelo?: string;
  descripcion?: string;
  categoriaId?: number;
  marcaId?: number;
  codigoInterno?: string;
  precioReferencia?: number;
  estado?: boolean;
}

export function usePartes() {
  const { data: session, status } = useSession();
  const {
    items: partes,
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
    setItems: setPartes,
    setSearchTerm,
    setShowInactive,
  } = useCrud<Parte, CreateParteDto, UpdateParteDto>('/partes', {
    defaultLimit: 10,
    listPath: '/partes/all',
    messages: {
      created: 'Parte creada exitosamente',
      updated: 'Parte actualizada exitosamente',
      deleted: 'Parte eliminada exitosamente',
      restored: 'Parte restaurada exitosamente',
      toggled: (enabled) => `Parte ${enabled ? 'activada' : 'desactivada'} exitosamente`,
      loadError: 'Error al cargar partes',
      createError: 'Error al crear parte',
      updateError: 'Error al actualizar parte',
      deleteError: 'Error al eliminar parte',
      restoreError: 'Error al restaurar parte',
      toggleError: 'Error al cambiar estado de la parte',
    },
  });

  const fetchPartes = fetchItems;
  const createParte = createItem;

  const fetchAllPartes = async (includeInactive: boolean = false) => {
    try {
      const data = await apiRequest<Parte[]>(
        `/partes?includeInactive=${includeInactive}`,
        {},
        session,
      );

      if (!Array.isArray(data)) {
        throw new Error("Formato de respuesta inválido");
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar ítems';
      throw new Error(message);
    }
  };

  const updateParte = updateItem;
  const toggleParteStatus = toggleItemStatus;
  const deleteParte = deleteItem;
  const restoreParte = restoreItem;

  useEffect(() => {
    if (status === "authenticated") {
      fetchPartes(1, 10, searchTerm, showInactive);
    }
  }, [status, searchTerm, showInactive]);

  return {
    partes,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchPartes,
    fetchAllPartes,
    createParte,
    updateParte,
    toggleParteStatus,
    deleteParte,
    restoreParte,
    setPartes,
    setSearchTerm,
    setShowInactive,
  };
}