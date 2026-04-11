'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";

export interface DetallePresupuestoItem {
  id: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  fechaUso: Date;
  estado: boolean;
  comentario: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  presupuestoId: number | null;
  orderId: number | null;
  parteId?: number | null;
  parte?: Parte | null;
  presupuesto?: Presupuesto;
  order?: Order;
}

export interface Parte {
  id: number;
  nombre: string;
  codigoInterno?: string | null;
  precioReferencia?: number;
}

export interface Presupuesto {
  id: number;
  ordenId: number;
  estadoId: number;
  descripcion: string | null;
}

export interface DetallePresupuestoItemTotalSummary {
  totalItems: number;
  cantidadItems: number;
  detalles: DetallePresupuestoItem[];
}

export interface Order {
  id: number;
  workOrderNumber: string;
}

interface CreateDetallePresupuestoItemDto {
  parteId?: number;
  cantidad: number;
  presupuestoId?: number;
  comentario?: string;
}

interface UpdateDetallePresupuestoItemDto {
  parteId?: number;
  cantidad?: number;
  presupuestoId?: number;
  orderId?: number;
  comentario?: string;
  estado?: boolean;
}

export function useDetallePresupuestoItem() {
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
  } = useCrud<DetallePresupuestoItem, CreateDetallePresupuestoItemDto, UpdateDetallePresupuestoItemDto>(
    '/detalles-presupuesto-item',
    {
      defaultLimit: 10,
      listPath: '/detalles-presupuesto-item/all',
      messages: {
        created: 'Detalle de ítem creado exitosamente',
        updated: 'Detalle de ítem actualizado exitosamente',
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

  const fetchDetallesByPresupuesto = async (presupuestoId: number, includeInactive: boolean = false) => {
    try {
      return await apiRequest<DetallePresupuestoItem[]>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-presupuesto-item/by-presupuesto/${presupuestoId}?includeInactive=${includeInactive}`,
        {},
        session,
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Error al cargar detalles');
    }
  };

  const fetchDetallesByOrder = async (orderId: number, includeInactive: boolean = false) => {
    try {
      return await apiRequest<DetallePresupuestoItem[]>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-presupuesto-item/by-orden/${orderId}?includeInactive=${includeInactive}`,
        {},
        session,
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Error al cargar detalles');
    }
  };

  const calculateTotalByPresupuesto = async (presupuestoId: number): Promise<DetallePresupuestoItemTotalSummary> => {
    try {
      return await apiRequest<DetallePresupuestoItemTotalSummary>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-presupuesto-item/by-presupuesto/${presupuestoId}/total`,
        {},
        session,
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Error al calcular total');
    }
  };

  const calculateTotalByOrder = async (orderId: number): Promise<DetallePresupuestoItemTotalSummary> => {
    try {
      return await apiRequest<DetallePresupuestoItemTotalSummary>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-presupuesto-item/by-orden/${orderId}/total`,
        {},
        session,
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Error al calcular total');
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
    fetchDetallesByOrder,
    createDetalle,
    updateDetalle,
    toggleDetalleStatus,
    deleteDetalle,
    restoreDetalle,
    calculateTotalByPresupuesto,
    calculateTotalByOrder,
    setDetalles,
    setSearchTerm,
    setShowInactive,
  };
}