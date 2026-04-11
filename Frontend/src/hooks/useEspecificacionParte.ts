'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";

export interface ParteEspecificacion {
  id: number;
  nombre: string;
}

export interface TipoEspecificacion {
  id: number;
  nombre: string;
}

export interface EspecificacionParte {
  id: number;
  valor: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  parte: ParteEspecificacion | null;
  tipoEspecificacion: TipoEspecificacion | null;
}

interface CreateEspecificacionDto {
  valor: string;
  parteId: number;
  tipoEspecificacionId: number;
}

interface UpdateEspecificacionDto {
  valor?: string;
  tipoEspecificacionId?: number;
  estado?: boolean;
}

export function useEspecificacionParte() {
  const { data: session, status } = useSession();
  const {
    items: especificaciones,
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
    setItems: setEspecificaciones,
    setSearchTerm,
    setShowInactive,
  } = useCrud<EspecificacionParte, CreateEspecificacionDto, UpdateEspecificacionDto>(
    '/especificaciones-parte',
    {
      defaultLimit: 10,
      listPath: '/especificaciones-parte/all',
      messages: {
        created: 'Especificacion creada exitosamente',
        updated: 'Especificacion actualizada exitosamente',
        deleted: 'Especificacion eliminada exitosamente',
        restored: 'Especificacion restaurada exitosamente',
        toggled: (enabled) => `Especificacion ${enabled ? 'activada' : 'desactivada'} exitosamente`,
        loadError: 'Error al cargar especificaciones',
        createError: 'Error al crear especificacion',
        updateError: 'Error al actualizar especificacion',
        deleteError: 'Error al eliminar especificacion',
        restoreError: 'Error al restaurar especificacion',
        toggleError: 'Error al cambiar estado de la especificacion',
      },
    },
  );

  const fetchEspecificaciones = fetchItems;
  const createEspecificacion = createItem;
  const updateEspecificacion = updateItem;
  const toggleEspecificacionStatus = toggleItemStatus;
  const deleteEspecificacion = deleteItem;
  const restoreEspecificacion = restoreItem;

  const fetchByParte = async (parteId: number, includeInactive: boolean = false) => {
    try {
      return await apiRequest<EspecificacionParte[]>(
        `/especificaciones-parte/by-parte/${parteId}?includeInactive=${includeInactive}`,
        {},
        session,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al cargar especificaciones por parte';
      throw new Error(message);
    }
  };

  const fetchByTipo = async (tipoId: number, includeInactive: boolean = false) => {
    try {
      return await apiRequest<EspecificacionParte[]>(
        `/especificaciones-parte/by-tipo/${tipoId}?includeInactive=${includeInactive}`,
        {},
        session,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al cargar especificaciones por tipo';
      throw new Error(message);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchEspecificaciones(1, 10, searchTerm, showInactive);
    }
  }, [status, searchTerm, showInactive]);

  return {
    especificaciones,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchEspecificaciones,
    fetchByParte,
    fetchByTipo,
    createEspecificacion,
    updateEspecificacion,
    toggleEspecificacionStatus,
    deleteEspecificacion,
    restoreEspecificacion,
    setEspecificaciones,
    setSearchTerm,
    setShowInactive,
  };
}