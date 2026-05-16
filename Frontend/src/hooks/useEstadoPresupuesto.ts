'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";

export interface PresupuestoEstado {
  id: number;
  nombre: string;
}

export interface EstadoPresupuesto {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  presupuestos?: PresupuestoEstado[];
}

interface CreateEstadoPresupuestoDto {
  nombre: string;
  descripcion: string;
}

interface UpdateEstadoPresupuestoDto {
  nombre?: string;
  descripcion?: string;
  estado?: boolean;
}

export function useEstadoPresupuesto() {
  const { status } = useSession();
  const {
    items: estados,
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
    setItems: setEstados,
    setSearchTerm,
    setShowInactive,
  } = useCrud<EstadoPresupuesto, CreateEstadoPresupuestoDto, UpdateEstadoPresupuestoDto>(
    '/estados-presupuesto',
    {
      defaultLimit: 10,
      listPath: '/estados-presupuesto/all',
      messages: {
        created: 'Estado de presupuesto creado exitosamente',
        updated: 'Estado de presupuesto actualizado exitosamente',
        deleted: 'Estado de presupuesto eliminado exitosamente',
        restored: 'Estado de presupuesto restaurado exitosamente',
        toggled: (enabled) =>
          `Estado de presupuesto ${enabled ? 'activado' : 'desactivado'} exitosamente`,
        loadError: 'Error al cargar estados de presupuesto',
        createError: 'Error al crear estado de presupuesto',
        updateError: 'Error al actualizar estado de presupuesto',
        deleteError: 'Error al eliminar estado de presupuesto',
        restoreError: 'Error al restaurar estado de presupuesto',
        toggleError: 'Error al cambiar estado del estado de presupuesto',
      },
    },
  );

  const fetchEstados = fetchItems;
  const createEstadoPresupuesto = createItem;
  const updateEstadoPresupuesto = updateItem;
  const toggleEstadoPresupuestoStatus = toggleItemStatus;
  const deleteEstadoPresupuesto = deleteItem;
  const restoreEstadoPresupuesto = restoreItem;

  useEffect(() => {
    if (status === "authenticated") {
      fetchEstados(1, 10, searchTerm, showInactive);
    }
  }, [status, searchTerm, showInactive]);

  return {
    estados,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchEstados,
    createEstadoPresupuesto,
    updateEstadoPresupuesto,
    toggleEstadoPresupuestoStatus,
    deleteEstadoPresupuesto,
    restoreEstadoPresupuesto,
    setEstados,
    setSearchTerm,
    setShowInactive,
  };
}