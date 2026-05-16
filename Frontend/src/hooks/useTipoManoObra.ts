'use client';
 
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";

export interface DetalleManoObra {
  id: number;
  cantidad?: number;
  createdAt?: string;
}

export interface TipoManoObra {
  id: number;
  nombre: string;
  codigo: string;
  estado: boolean;
  descripcion: string | null;
  costo: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  detalles?: DetalleManoObra[];
}

interface CreateTipoManoObraDto {
  nombre: string;
  codigo: string;
  descripcion?: string;
  costo: number;
  estado?: boolean;
}

interface UpdateTipoManoObraDto {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  costo?: number;
  estado?: boolean;
}

export function useTipoManoObra() {
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
  } = useCrud<TipoManoObra, CreateTipoManoObraDto, UpdateTipoManoObraDto>(
    '/tipos-mano-obra',
    {
      listPath: '/tipos-mano-obra/all',
      defaultLimit: 10,
      messages: {
        created: 'Tipo de mano de obra creado exitosamente',
        updated: 'Tipo de mano de obra actualizado exitosamente',
        deleted: 'Tipo de mano de obra eliminado exitosamente',
        restored: 'Tipo de mano de obra restaurado exitosamente',
        loadError: 'Error al cargar tipos de mano de obra',
        createError: 'Error al crear tipo de mano de obra',
        updateError: 'Error al actualizar tipo de mano de obra',
        deleteError: 'Error al eliminar tipo de mano de obra',
        restoreError: 'Error al restaurar tipo de mano de obra',
        toggleError: 'Error al cambiar estado del tipo de mano de obra',
      },
    },
  );

  const fetchTipos = fetchItems;

  const fetchAllTipos = async (includeInactive: boolean = false) => {
    try {
      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-mano-obra`;

      if (includeInactive) {
        url += `?includeInactive=true`;
      }

      const data = await apiRequest<TipoManoObra[]>(
        url,
        {},
        session,
      );

      if (!Array.isArray(data)) {
        throw new Error("Formato de respuesta inválido");
      }

      setTipos(data);
    } catch (error) {
      setTipos([]);
    }
  };

  const createTipo = createItem;
  const updateTipo = updateItem;
  const toggleTipoStatus = toggleItemStatus;
  const deleteTipo = deleteItem;
  const restoreTipo = restoreItem;

  const getTipoByCodigo = async (codigo: string) => {
    try {
      return await apiRequest<TipoManoObra>(
        `/tipos-mano-obra/codigo/${codigo}`,
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
    fetchAllTipos,
    createTipo,
    updateTipo,
    toggleTipoStatus,
    deleteTipo,
    restoreTipo,
    getTipoByCodigo,
    setTipos,
    setSearchTerm,
    setShowInactive,
  };
}