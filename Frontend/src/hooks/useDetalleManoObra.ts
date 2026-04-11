'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";

export interface DetalleManoObra {
  id: number;
  presupuestoId: number;
  tipoManoObraId: number;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tipoManoObra?: TipoManoObra;
  presupuesto?: Presupuesto;
}

export interface TipoManoObra {
  id: number;
  nombre: string;
  codigo: string;
  costo: number;
  estado: boolean;
}

export interface Presupuesto {
  id: number;
  ordenId: number;
  estadoId: number;
  descripcion: string;
  fechaEmision: string;
}

interface CreateDetalleManoObraDto {
  presupuestoId: number;
  tipoManoObraId: number;
  cantidad: number;
}

interface UpdateDetalleManoObraDto {
  presupuestoId?: number;
  tipoManoObraId?: number;
  cantidad?: number;
  estado?: boolean;
}

interface ResumenManoObra {
  totalManoObra: number;
  cantidadItems: number;
  detalles: DetalleManoObra[];
}

export function useDetalleManoObra() {
  const { data: session, status } = useSession();
  const {
    items: detalles,
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
    setItems: setDetalles,
    setSearchTerm,
    setShowInactive,
  } = useCrud<DetalleManoObra, CreateDetalleManoObraDto, UpdateDetalleManoObraDto>(
    '/detalles-mano-obra',
    {
      defaultLimit: 10,
      listPath: '/detalles-mano-obra/all',
      messages: {
        created: 'Detalle de mano de obra creado exitosamente',
        updated: 'Detalle actualizado exitosamente',
        deleted: 'Detalle eliminado exitosamente',
        restored: 'Detalle restaurado exitosamente',
        toggled: (enabled) => `Detalle ${enabled ? 'activado' : 'desactivado'} exitosamente`,
        loadError: 'Error al cargar detalles',
        createError: 'Error al crear detalle',
        updateError: 'Error al actualizar detalle',
        deleteError: 'Error al eliminar detalle',
        restoreError: 'Error al restaurar detalle',
        toggleError: 'Error al cambiar estado',
      },
    },
  );

  const fetchDetalles = fetchItems;
  const createDetalle = createItem;
  const updateDetalle = updateItem;
  const toggleDetalleStatus = toggleItemStatus;
  const deleteDetalle = deleteItem;
  const restoreDetalle = restoreItem;

  const fetchDetallesByPresupuesto = async (
    presupuestoId: number,
    includeInactive: boolean = false
  ) => {
    try {
      let url = `/detalles-mano-obra/by-presupuesto/${presupuestoId}`;

      if (includeInactive) {
        url += `?includeInactive=true`;
      }

      const data = await apiRequest<DetalleManoObra[] | DetalleManoObra | null>(url, {}, session);

      if (!data) return [];
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error(`Error al obtener detalles por presupuesto ${presupuestoId}:`, error);
      return []; // Siempre devolver un array, incluso en caso de error
    }
  };

  const getResumenManoObra = async (presupuestoId: number): Promise<ResumenManoObra> => {
    try {
      return await apiRequest<ResumenManoObra>(
        `/detalles-mano-obra/by-presupuesto/${presupuestoId}/total`,
        {},
        session,
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Error al cargar resumen');
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchDetalles(1, 10, searchTerm, showInactive);
    }
  }, [status, searchTerm, showInactive]);

  return {
    detalles,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchDetalles,
    fetchDetallesByPresupuesto,
    getResumenManoObra,
    createDetalle,
    updateDetalle,
    toggleDetalleStatus,
    deleteDetalle,
    restoreDetalle,
    setDetalles,
    setSearchTerm,
    setShowInactive,
  };
}