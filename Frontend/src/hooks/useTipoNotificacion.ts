'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface NotificacionTipo {
  id: number;
  nombre: string;
}

export interface TipoNotificacion {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notificaciones?: NotificacionTipo[];
}

// Respuesta paginada del backend
interface PaginatedTipoNotificacionResponse {
  items: TipoNotificacion[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useTipoNotificacion() {
  const { data: session, status } = useSession();
  const [tipos, setTipos] = useState<TipoNotificacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchTipos = async (
    page: number = 1,
    limit: number = 10,
    search: string = "",
    includeInactive: boolean = false
  ) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-notificacion/all?page=${page}&limit=${limit}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      if (includeInactive) {
        url += `&includeInactive=true`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: PaginatedTipoNotificacionResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setTipos(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener tipos de notificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar tipos de notificación");
      setTipos([]);
    } finally {
      setLoading(false);
    }
  };

  const createTipo = async (tipoData: { nombre: string; descripcion?: string }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-notificacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(tipoData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const newTipo = await response.json();
      toast.success("Tipo de notificación creado exitosamente");
      return newTipo;
    } catch (error) {
      console.error("Error al crear tipo de notificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear tipo de notificación");
      throw error;
    }
  };

  const updateTipo = async (id: number, tipoData: { nombre?: string; descripcion?: string; estado?: boolean }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-notificacion/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(tipoData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedTipo = await response.json();
      toast.success("Tipo de notificación actualizado exitosamente");
      return updatedTipo;
    } catch (error) {
      console.error("Error al actualizar tipo de notificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar tipo de notificación");
      throw error;
    }
  };

  const toggleTipoStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-notificacion/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedTipo = await response.json();
      toast.success(`Tipo de notificación ${updatedTipo.estado ? 'activado' : 'desactivado'} exitosamente`);
      return updatedTipo;
    } catch (error) {
      console.error("Error al cambiar estado del tipo de notificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del tipo de notificación");
      throw error;
    }
  };

  const deleteTipo = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-notificacion/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      toast.success(result.message || "Tipo de notificación eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar tipo de notificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar tipo de notificación");
      throw error;
    }
  };

  const restoreTipo = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-notificacion/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      toast.success(result.message || "Tipo de notificación restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar tipo de notificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar tipo de notificación");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchTipos(1, 10, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    tipos,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchTipos,
    createTipo,
    updateTipo,
    toggleTipoStatus,
    deleteTipo,
    restoreTipo,
    setTipos,
    setSearchTerm,
    setShowInactive,
  };
}