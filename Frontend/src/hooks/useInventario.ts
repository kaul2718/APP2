'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";

export interface ParteInventario {
  id: number;
  nombre: string;
  modelo: string;
}

export interface Inventario {
  id: number;
  cantidad: number;
  stockMinimo: number;
  ubicacion: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  parte: ParteInventario | null; // Asegúrate que puede ser null
  parteId: number;
}

interface CreateInventarioDto {
  parteId: number;
  cantidad: number;
  stockMinimo: number;
  ubicacion: string;
}

interface UpdateInventarioDto {
  parteId?: number;
  cantidad?: number;
  stockMinimo?: number;
  ubicacion?: string;
  estado?: boolean;
}

export function useInventario() {
  const { data: session, status } = useSession();
  const {
    items: inventarios,
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
    setItems: setInventarios,
    setSearchTerm,
    setShowInactive,
  } = useCrud<Inventario, CreateInventarioDto, UpdateInventarioDto>('/inventario', {
    defaultLimit: 10,
    listPath: '/inventario/all',
    messages: {
      created: 'Registro de inventario creado exitosamente',
      updated: 'Inventario actualizado exitosamente',
      deleted: 'Registro de inventario eliminado exitosamente',
      restored: 'Registro de inventario restaurado exitosamente',
      toggled: (enabled) => `Producto ${enabled ? 'activado' : 'desactivado'} exitosamente`,
      loadError: 'Error al cargar inventarios',
      createError: 'Error al crear registro de inventario',
      updateError: 'Error al actualizar inventario',
      deleteError: 'Error al eliminar inventario',
      restoreError: 'Error al restaurar inventario',
      toggleError: 'Error al cambiar estado del inventario',
    },
  });
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  const fetchInventarios = async (
    page: number = 1,
    limit: number = 10,
    search: string = "",
    includeInactive: boolean = false,
    lowStock: boolean = false
  ) => {
    if (lowStock) {
      await fetchItems(
        page,
        limit,
        '',
        false,
        search ? { ubicacion: search } : undefined,
        '/inventario/bajo-stock',
      );
      return;
    }

    await fetchItems(page, limit, search, includeInactive);
  };

  const createInventario = async (inventarioData: {
    parteId: number;
    cantidad: number;
    stockMinimo: number;
    ubicacion: string;
  }) => {
    try {
      // Validación mejorada
      if (typeof inventarioData.cantidad !== 'number' ||
        inventarioData.cantidad < 0 ||
        !Number.isInteger(inventarioData.cantidad)) {
        throw new Error("La cantidad debe ser un número entero positivo");
      }

      if (typeof inventarioData.stockMinimo !== 'number' ||
        inventarioData.stockMinimo < 0 ||
        !Number.isInteger(inventarioData.stockMinimo)) {
        throw new Error("El stock mínimo debe ser un número entero positivo");
      }

      const newInventario = await createItem({
        ...inventarioData,
      });

      // Actualizar la lista de inventarios
      await fetchInventarios(currentPage, 10, searchTerm, showInactive, lowStockOnly);

      return newInventario;
    } catch (error) {
      console.error("Error al crear inventario:", error);

      // Mostrar cada mensaje de error en líneas separadas
      if (error instanceof Error) {
        error.message.split('\n').forEach(msg => {
          if (msg.trim()) toast.error(msg.trim());
        });
      } else {
        toast.error("Error al crear registro de inventario");
      }

      throw error;
    } finally {
      // loading es gestionado por useCrud
    }
  };

  const updateInventario = async (id: number, inventarioData: UpdateInventarioDto) => {
    try {
      const updatedInventario = await updateItem(id, inventarioData);
      return updatedInventario;
    } catch (error) {
      console.error("Error al actualizar inventario:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar inventario");
      throw error;
    }
  };

  const updateStock = async (id: number, cantidad: number, operacion: 'add' | 'subtract') => {
    try {
      const updatedInventario = await apiRequest<Inventario>(
        `/inventario/${id}/update-stock`,
        {
          method: 'PATCH',
          body: JSON.stringify({ cantidad, operacion }),
        },
        session,
      );
      toast.success("Stock actualizado exitosamente");
      return updatedInventario;
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar stock");
      throw error;
    }
  };

  const checkStock = async (id: number) => {
    try {
      return await apiRequest(`/inventario/${id}/check-stock`, {}, session);
    } catch (error) {
      console.error("Error al verificar stock:", error);
      toast.error(error instanceof Error ? error.message : "Error al verificar stock");
      throw error;
    }
  };

  const toggleInventarioStatus = toggleItemStatus;
  const deleteInventario = deleteItem;
  const restoreInventario = restoreItem;

  useEffect(() => {
    if (status === "authenticated") {
      fetchInventarios(1, 10, searchTerm, showInactive, lowStockOnly);
    }
  }, [status, searchTerm, showInactive, lowStockOnly]);

  return {
    inventarios,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    lowStockOnly,
    fetchInventarios,
    createInventario,
    updateInventario,
    updateStock,
    checkStock,
    toggleInventarioStatus,
    deleteInventario,
    restoreInventario,
    setInventarios,
    setSearchTerm,
    setShowInactive,
    setLowStockOnly,
  };
}