'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { apiRequest } from "@/lib/api";
import { useCrud } from "@/hooks/useCrud";

export interface OrderCasillero {
  id: number;
  workOrderNumber: string;
}

export interface Casillero {
  id: number;
  codigo: string;
  descripcion: string;
  situacion: 'Ocupado' | 'Disponible';
  estado: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: OrderCasillero | null;
}

interface CreateCasilleroDto {
  codigo: string;
  descripcion: string;
}

interface UpdateCasilleroDto {
  codigo?: string;
  descripcion?: string;
  estado?: boolean;
}

export function useCasillero() {
  const { data: session, status } = useSession();
  const {
    items: casilleros,
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
    setItems: setCasilleros,
    setSearchTerm,
    setShowInactive,
  } = useCrud<Casillero, CreateCasilleroDto, UpdateCasilleroDto>('/casilleros', {
    defaultLimit: 10,
    listPath: '/casilleros/all',
    messages: {
      created: 'Casillero creado exitosamente',
      updated: 'Casillero actualizado exitosamente',
      deleted: 'Casillero eliminado exitosamente',
      restored: 'Casillero restaurado exitosamente',
      toggled: (enabled) => `Casillero ${enabled ? 'activado' : 'desactivado'} exitosamente`,
      loadError: 'Error al cargar casilleros',
      createError: 'Error al crear casillero',
      updateError: 'Error al actualizar casillero',
      deleteError: 'Error al eliminar casillero',
      restoreError: 'Error al restaurar casillero',
      toggleError: 'Error al cambiar estado del casillero',
    },
  });
  const [situacionFilter, setSituacionFilter] = useState<string | undefined>();

  const fetchCasilleros = async (
    page: number = 1,
    limit: number = 10,
    search: string = "",
    includeInactive: boolean = false,
    situacion?: string
  ) => {
    await fetchItems(page, limit, search, includeInactive, { situacion });
  };

  const fetchAvailableCasilleros = async () => {
    try {
      const data = await apiRequest<Casillero[]>('/casilleros/disponibles', {}, session);
      return data;
    } catch (error) {
      console.error("Error al obtener casilleros disponibles:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar casilleros disponibles");
      return [];
    } finally {
      // UseCrud maneja loading para la lista principal; este endpoint solo retorna datos.
    }
  };

  const createCasillero = createItem;
  const updateCasillero = updateItem;
  const toggleCasilleroStatus = toggleItemStatus;
  const deleteCasillero = deleteItem;
  const restoreCasillero = restoreItem;

  const assignOrder = async (casilleroId: number, orderId: number) => {
    try {
      const updatedCasillero = await apiRequest<Casillero>(
        `/casilleros/${casilleroId}/asignar-orden/${orderId}`,
        {
          method: 'PATCH',
        },
        session,
      );
      toast.success("Orden asignada al casillero exitosamente");
      return updatedCasillero;
    } catch (error) {
      console.error("Error al asignar orden al casillero:", error);
      toast.error(error instanceof Error ? error.message : "Error al asignar orden al casillero");
      throw error;
    }
  };

  const releaseCasillero = async (casilleroId: number) => {
    try {
      const updatedCasillero = await apiRequest<Casillero>(
        `/casilleros/${casilleroId}/liberar`,
        {
          method: 'PATCH',
        },
        session,
      );
      toast.success("Casillero liberado exitosamente");
      return updatedCasillero;
    } catch (error) {
      console.error("Error al liberar casillero:", error);
      toast.error(error instanceof Error ? error.message : "Error al liberar casillero");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCasilleros(1, 10, searchTerm, showInactive, situacionFilter);
    }
  }, [status, searchTerm, showInactive, situacionFilter]);

  return {
    casilleros,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    situacionFilter,
    fetchCasilleros,
    fetchAvailableCasilleros,
    createCasillero,
    updateCasillero,
    toggleCasilleroStatus,
    deleteCasillero,
    restoreCasillero,
    assignOrder,
    releaseCasillero,
    setCasilleros,
    setSearchTerm,
    setShowInactive,
    setSituacionFilter,
  };
}