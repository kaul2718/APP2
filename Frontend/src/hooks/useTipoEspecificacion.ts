'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface TipoEspecificacion {
  id: number;
  nombre: string;
  unidad: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Respuesta paginada del backend
interface PaginatedTipoEspecificacionResponse {
  items: TipoEspecificacion[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useTipoEspecificacion() {
  const { data: session, status } = useSession();
  const [tipos, setTipos] = useState<TipoEspecificacion[]>([]);
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipo-especificacion/all?page=${page}&limit=${limit}`;

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

      const data: PaginatedTipoEspecificacionResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setTipos(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener tipos de especificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar tipos de especificación");
      setTipos([]);
    } finally {
      setLoading(false);
    }
  };

  const createTipo = async (tipoData: { nombre: string; unidad: string }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipo-especificacion`, {
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
      toast.success("Tipo de especificación creado exitosamente");
      return newTipo;
    } catch (error) {
      console.error("Error al crear tipo de especificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear tipo de especificación");
      throw error;
    }
  };

  const updateTipo = async (id: number, tipoData: { nombre?: string; unidad?: string; estado?: boolean }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipo-especificacion/${id}`, {
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
      toast.success("Tipo de especificación actualizado exitosamente");
      return updatedTipo;
    } catch (error) {
      console.error("Error al actualizar tipo de especificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar tipo de especificación");
      throw error;
    }
  };

  const toggleTipoStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipo-especificacion/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedTipo = await response.json();
      toast.success(`Tipo de especificación ${updatedTipo.estado ? 'activado' : 'desactivado'} exitosamente`);
      return updatedTipo;
    } catch (error) {
      console.error("Error al cambiar estado del tipo de especificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del tipo de especificación");
      throw error;
    }
  };

  const deleteTipo = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipo-especificacion/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Tipo de especificación eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar tipo de especificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar tipo de especificación");
      throw error;
    }
  };

  const restoreTipo = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipo-especificacion/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Tipo de especificación restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar tipo de especificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar tipo de especificación");
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