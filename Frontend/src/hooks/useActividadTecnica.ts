'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/pagination.types";
import type {
  ActividadTecnica,
  OrderActividad,
  TipoActividadTecnica,
} from "@/types/actividad.types";

type PaginatedActividadResponse = PaginatedResponse<ActividadTecnica>;
export type { TipoActividadTecnica, OrderActividad, ActividadTecnica };

interface CreateActividadTecnicaDto {
  ordenId: number;
  tipoActividadId: number;
  diagnostico: string;
  trabajoRealizado: string;
}

interface UpdateActividadTecnicaDto {
  diagnostico?: string;
  trabajoRealizado?: string;
  tipoActividadId?: number;
  estado?: boolean;
}

export function useActividadTecnica() {
  const { data: session, status } = useSession();
  const {
    items: actividades,
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
    setItems: setActividades,
    setSearchTerm,
    setShowInactive,
  } = useCrud<ActividadTecnica, CreateActividadTecnicaDto, UpdateActividadTecnicaDto>(
    '/actividades-tecnicas',
    {
      defaultLimit: 100,
      listPath: '/actividades-tecnicas/all',
      messages: {
        created: 'Actividad tecnica creada exitosamente',
        updated: 'Actividad tecnica actualizada exitosamente',
        deleted: 'Actividad tecnica eliminada exitosamente',
        restored: 'Actividad tecnica restaurada exitosamente',
        toggled: (enabled) => `Actividad tecnica ${enabled ? 'activada' : 'desactivada'} exitosamente`,
        loadError: 'Error al cargar actividades tecnicas',
        createError: 'Error al crear actividad tecnica',
        updateError: 'Error al actualizar actividad tecnica',
        deleteError: 'Error al eliminar actividad tecnica',
        restoreError: 'Error al restaurar actividad tecnica',
        toggleError: 'Error al cambiar estado de la actividad tecnica',
      },
    },
  );

  const fetchActividades = async (
    page: number = 1,
    limit: number = 100,
    search: string = "",
    includeInactive: boolean = false
  ) => {
    await fetchItems(page, limit, search, includeInactive, includeInactive ? undefined : { estado: true });
  };
  const toggleActividadStatus = toggleItemStatus;
  const deleteActividad = deleteItem;
  const restoreActividad = restoreItem;

  /*PARA QUE FUNCIONE EL MODAL DESDE LA TABLA ORDERS*/

  // Función para crear actividad técnica (Paso 1 del modal)
  const createActividadTecnica = createItem;

  // Función para actualizar actividad técnica (Paso 2 del modal)
  const updateActividadTecnica = updateItem;

  // Función para obtener actividades por orden (para mostrar en tabla)
  const getActividadesByOrder = async (ordenId: number) => {
    try {
      return await apiRequest<ActividadTecnica[]>(
        `/actividades-tecnicas/por-orden/${ordenId}`,
        {},
        session,
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Error al obtener actividades tecnicas');
    }
  };

  useEffect(() => {
    //onsole.log("Estado de autenticación:", status);
    //console.log("Token de sesión:", session?.accessToken ? "Disponible" : "No disponible");

    if (status === "authenticated") {
      //console.log("Iniciando carga inicial de actividades");
      fetchActividades(1, 100, searchTerm, showInactive);
    }
  }, [status, searchTerm, showInactive]);
  return {
    actividades,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    createActividadTecnica,
    updateActividadTecnica,
    getActividadesByOrder,
    fetchActividades,
    toggleActividadStatus,
    deleteActividad,
    restoreActividad,
    setActividades,
    setSearchTerm,
    setShowInactive,
  };
}