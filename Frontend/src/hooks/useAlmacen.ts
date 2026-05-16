'use client';
 
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";

export interface ItemAlmacen {
  id: number;
  nombre: string;
  modelo: string | null;
  descripcion: string | null;
  codigoInterno: string | null;
  costo: number;
  precio1: number;
  precio2: number;
  precio3: number;
  precio4: number;
  ivaTarifa: number;
  stock: number;
  stockMinimo: number;
  ubicacion: string | null;
  unidadMedida: string;
  permiteModificarPrecio: boolean;
  permiteFraccionar: boolean;
  estado: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  categoria: { id: number; nombre: string } | null;
  marca: { id: number; nombre: string } | null;
}

interface CreateItemDto {
  nombre: string;
  modelo?: string;
  descripcion?: string;
  codigoInterno?: string;
  categoriaId: number;
  marcaId: number;
  costo: number;
  precio1: number;
  precio2: number;
  precio3: number;
  precio4: number;
  ivaTarifa: number;
  stock: number;
  stockMinimo: number;
  ubicacion?: string;
  unidadMedida?: string;
  permiteModificarPrecio?: boolean;
  permiteFraccionar?: boolean;
  estado?: boolean;
}

export function useAlmacen() {
  const { data: session, status } = useSession();
  const {
    items,
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
    setItems,
    setSearchTerm,
    setShowInactive,
  } = useCrud<ItemAlmacen, CreateItemDto, Partial<CreateItemDto>>('/partes', {
    defaultLimit: 10,
    listPath: '/partes/all',
    messages: {
      created: 'Item de almacén creado exitosamente',
      updated: 'Item de almacén actualizado exitosamente',
      deleted: 'Item de almacén eliminado exitosamente',
      restored: 'Item de almacén restaurado exitosamente',
      toggled: (enabled) => `Item ${enabled ? 'activado' : 'desactivado'} exitosamente`,
      loadError: 'Error al cargar items',
      createError: 'Error al crear item',
      updateError: 'Error al actualizar item',
      deleteError: 'Error al eliminar item',
      restoreError: 'Error al restaurar item',
      toggleError: 'Error al cambiar estado del item',
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchItems(1, 10, searchTerm, showInactive);
    }
  }, [status, searchTerm, showInactive]);

  return {
    items,
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
    setItems,
    setSearchTerm,
    setShowInactive,
  };
}