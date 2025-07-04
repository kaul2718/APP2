'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface ActividadTecnica {
  id: number;
  nombre: string;
}

export interface TipoActividadTecnica {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  actividades?: ActividadTecnica[];
}

// Respuesta paginada del backend
interface PaginatedTipoActividadResponse {
  items: TipoActividadTecnica[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useTipoActividadTecnica() {
  const { data: session, status } = useSession();
  const [tipos, setTipos] = useState<TipoActividadTecnica[]>([]);
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-actividad-tecnica/all?page=${page}&limit=${limit}`;

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

      const data: PaginatedTipoActividadResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setTipos(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener tipos de actividad técnica:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar tipos de actividad técnica");
      setTipos([]);
    } finally {
      setLoading(false);
    }
  };

  const createTipoActividad = async (tipoData: { nombre: string; descripcion?: string }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-actividad-tecnica`, {
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
      toast.success("Tipo de actividad técnica creado exitosamente");
      return newTipo;
    } catch (error) {
      console.error("Error al crear tipo de actividad técnica:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear tipo de actividad técnica");
      throw error;
    }
  };

  const updateTipoActividad = async (id: number, tipoData: { nombre?: string; descripcion?: string; estado?: boolean }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-actividad-tecnica/${id}`, {
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
      toast.success("Tipo de actividad técnica actualizado exitosamente");
      return updatedTipo;
    } catch (error) {
      console.error("Error al actualizar tipo de actividad técnica:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar tipo de actividad técnica");
      throw error;
    }
  };

  const toggleTipoActividadStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-actividad-tecnica/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedTipo = await response.json();
      toast.success(`Tipo de actividad técnica ${updatedTipo.estado ? 'activado' : 'desactivado'} exitosamente`);
      return updatedTipo;
    } catch (error) {
      console.error("Error al cambiar estado del tipo de actividad técnica:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del tipo de actividad técnica");
      throw error;
    }
  };

  const deleteTipoActividad = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-actividad-tecnica/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      toast.success(result.message || "Tipo de actividad técnica eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar tipo de actividad técnica:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar tipo de actividad técnica");
      throw error;
    }
  };

  const restoreTipoActividad = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-actividad-tecnica/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      toast.success(result.message || "Tipo de actividad técnica restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar tipo de actividad técnica:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar tipo de actividad técnica");
      throw error;
    }
  };

  const fetchAllTipos = async (includeInactive: boolean = false) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-actividad-tecnica?includeInactive=${includeInactive}`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener todos los tipos:", error);
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
    createTipoActividad,
    updateTipoActividad,
    toggleTipoActividadStatus,
    deleteTipoActividad,
    restoreTipoActividad,
    fetchAllTipos,
    setTipos,
    setSearchTerm,
    setShowInactive,
  };
}