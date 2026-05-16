'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useCrud } from "@/hooks/useCrud";
import { apiRequest } from "@/lib/api";

export interface Equipo {
  id: number;
  numeroSerie: string;
  estado: boolean;
  tipoEquipo: {
    id: number;
    nombre: string;
  } | null;
  marca: {
    id: number;
    nombre: string;
  } | null;
  modelo: {
    id: number;
    nombre: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

interface CreateEquipoDto {
  numeroSerie: string;
  tipoEquipoId: number;
  marcaId: number;
  modeloId: number;
}

interface UpdateEquipoDto {
  numeroSerie?: string;
  tipoEquipoId?: number;
  marcaId?: number;
  modeloId?: number;
  estado?: boolean;
}

interface UseEquiposReturn {
  equipos: Equipo[];
  loading: boolean;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  searchTerm: string;
  showInactive: boolean;
  fetchEquipos: (
    page?: number,
    limit?: number,
    search?: string,
    includeInactive?: boolean
  ) => Promise<void>;
  refetch: () => Promise<void>; // Nueva función refetch
  setEquipos: React.Dispatch<React.SetStateAction<Equipo[]>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setShowInactive: React.Dispatch<React.SetStateAction<boolean>>;
  toggleEstado: (equipo: Equipo) => Promise<void>;
  createEquipo: (equipoData: any) => Promise<Equipo>; // Cambiado para devolver siempre Equipo
  updateEquipo: (id: number, equipoData: any) => Promise<Equipo>;
  deleteEquipo: (id: number) => Promise<boolean>;
  restoreEquipo: (id: number) => Promise<boolean>;
}

export function useEquipos(): UseEquiposReturn {
  const { data: session, status } = useSession();
  const {
    items: equipos,
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
    setItems: setEquipos,
    setSearchTerm,
    setShowInactive,
  } = useCrud<Equipo, CreateEquipoDto, UpdateEquipoDto>('/equipos', {
    defaultLimit: 10,
    listPath: '/equipos/all',
    messages: {
      created: 'Equipo creado exitosamente',
      updated: 'Equipo actualizado exitosamente',
      deleted: 'Equipo eliminado exitosamente',
      restored: 'Equipo restaurado exitosamente',
      toggled: (enabled) => `Equipo ${enabled ? 'habilitado' : 'deshabilitado'} correctamente`,
      loadError: 'Error al cargar equipos',
      createError: 'Error al crear equipo',
      updateError: 'Error al actualizar equipo',
      deleteError: 'Error al eliminar equipo',
      restoreError: 'Error al restaurar equipo',
      toggleError: 'Error al cambiar estado',
    },
  });

  const fetchEquipos = fetchItems;

  // Nueva función refetch
  const refetch = async () => {
    await fetchEquipos(currentPage, 10, searchTerm, showInactive);
  };

  const createEquipo = async (equipoData: CreateEquipoDto): Promise<Equipo> => {
    try {
      const newEquipo = await createItem(equipoData);
      
      // Actualizamos la lista de equipos pero no redirigimos
      await refetch();
      
      return newEquipo;
    } catch (error) {
      console.error("Error al crear equipo:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear equipo");
      throw error;
    }
  };

  const updateEquipo = async (id: number, equipoData: UpdateEquipoDto): Promise<Equipo> => {
    try {
      const updatedEquipo = await updateItem(id, equipoData);
      await refetch();
      return updatedEquipo;
    } catch (error) {
      console.error("Error al actualizar equipo:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar equipo");
      throw error;
    }
  };

  const toggleEstado = async (equipo: Equipo) => {
    try {
      const nuevoEstado = !equipo.estado;
      await apiRequest(
        `/equipos/${equipo.id}/toggle-estado`,
        {
          method: "PATCH",
          body: JSON.stringify({ estado: nuevoEstado }),
        },
        session,
      );
      toast.success(`Equipo ${nuevoEstado ? 'habilitado' : 'deshabilitado'} correctamente`);
      await refetch();
    } catch (error) {
      console.error(`Error al cambiar estado del equipo:`, error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
      throw error;
    }
  };

  const deleteEquipo = async (id: number) => {
    try {
      await deleteItem(id);
      await refetch();
      return true;
    } catch (error) {
      console.error("Error al eliminar equipo:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar equipo");
      throw error;
    }
  };

  const restoreEquipo = async (id: number) => {
    try {
      await restoreItem(id);
      await refetch();
      return true;
    } catch (error) {
      console.error("Error al restaurar equipo:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar equipo");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchEquipos(1, 10, searchTerm, showInactive);
    }
  }, [status, searchTerm, showInactive]);

  return {
    equipos,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchEquipos,
    refetch, // Añadimos refetch al objeto retornado
    setEquipos,
    setSearchTerm,
    setShowInactive,
    toggleEstado,
    createEquipo,
    updateEquipo,
    deleteEquipo,
    restoreEquipo,
  };
}