'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

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

// Respuesta paginada del backend
interface PaginatedEspecificacionResponse {
  items: EspecificacionParte[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useEspecificacionParte() {
  const { data: session, status } = useSession();
  const [especificaciones, setEspecificaciones] = useState<EspecificacionParte[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchEspecificaciones = async (
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/especificaciones-parte/all?page=${page}&limit=${limit}`;

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

      const data: PaginatedEspecificacionResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setEspecificaciones(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener especificaciones:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar especificaciones");
      setEspecificaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchByParte = async (parteId: number, includeInactive: boolean = false) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/especificaciones-parte/by-parte/${parteId}?includeInactive=${includeInactive}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: EspecificacionParte[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error al obtener especificaciones por parte:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar especificaciones por parte");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchByTipo = async (tipoId: number, includeInactive: boolean = false) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/especificaciones-parte/by-tipo/${tipoId}?includeInactive=${includeInactive}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: EspecificacionParte[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error al obtener especificaciones por tipo:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar especificaciones por tipo");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createEspecificacion = async (especificacionData: { 
    valor: string; 
    parteId: number; 
    tipoEspecificacionId: number 
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/especificaciones-parte`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(especificacionData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const newEspecificacion = await response.json();
      toast.success("Especificación creada exitosamente");
      return newEspecificacion;
    } catch (error) {
      console.error("Error al crear especificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear especificación");
      throw error;
    }
  };

  const updateEspecificacion = async (
    id: number, 
    especificacionData: { 
      valor?: string; 
      tipoEspecificacionId?: number; 
      estado?: boolean 
    }
  ) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/especificaciones-parte/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(especificacionData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedEspecificacion = await response.json();
      toast.success("Especificación actualizada exitosamente");
      return updatedEspecificacion;
    } catch (error) {
      console.error("Error al actualizar especificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar especificación");
      throw error;
    }
  };

  const toggleEspecificacionStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/especificaciones-parte/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedEspecificacion = await response.json();
      toast.success(`Especificación ${updatedEspecificacion.estado ? 'activada' : 'desactivada'} exitosamente`);
      return updatedEspecificacion;
    } catch (error) {
      console.error("Error al cambiar estado de la especificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado de la especificación");
      throw error;
    }
  };

  const deleteEspecificacion = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/especificaciones-parte/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Especificación eliminada exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar especificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar especificación");
      throw error;
    }
  };

  const restoreEspecificacion = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/especificaciones-parte/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Especificación restaurada exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar especificación:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar especificación");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchEspecificaciones(1, 10, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

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