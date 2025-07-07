'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface PresupuestoEstado {
  id: number;
  nombre: string;
}

export interface EstadoPresupuesto {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  presupuestos?: PresupuestoEstado[];
}

// Respuesta paginada del backend
interface PaginatedEstadoPresupuestoResponse {
  items: EstadoPresupuesto[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useEstadoPresupuesto() {
  const { data: session, status } = useSession();
  const [estados, setEstados] = useState<EstadoPresupuesto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchEstados = async (
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-presupuesto/all?page=${page}&limit=${limit}`;

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

      const data: PaginatedEstadoPresupuestoResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setEstados(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener estados de presupuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar estados de presupuesto");
      setEstados([]);
    } finally {
      setLoading(false);
    }
  };

  const createEstadoPresupuesto = async (estadoData: { nombre: string; descripcion: string }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-presupuesto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(estadoData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const newEstado = await response.json();
      toast.success("Estado de presupuesto creado exitosamente");
      return newEstado;
    } catch (error) {
      console.error("Error al crear estado de presupuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear estado de presupuesto");
      throw error;
    }
  };

  const updateEstadoPresupuesto = async (id: number, estadoData: { nombre?: string; descripcion?: string; estado?: boolean }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-presupuesto/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(estadoData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedEstado = await response.json();
      toast.success("Estado de presupuesto actualizado exitosamente");
      return updatedEstado;
    } catch (error) {
      console.error("Error al actualizar estado de presupuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar estado de presupuesto");
      throw error;
    }
  };

  const toggleEstadoPresupuestoStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-presupuesto/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedEstado = await response.json();
      toast.success(`Estado de presupuesto ${updatedEstado.estado ? 'activado' : 'desactivado'} exitosamente`);
      return updatedEstado;
    } catch (error) {
      console.error("Error al cambiar estado del estado de presupuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del estado de presupuesto");
      throw error;
    }
  };

  const deleteEstadoPresupuesto = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-presupuesto/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Estado de presupuesto eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar estado de presupuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar estado de presupuesto");
      throw error;
    }
  };

  const restoreEstadoPresupuesto = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-presupuesto/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Estado de presupuesto restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar estado de presupuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar estado de presupuesto");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchEstados(1, 10, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    estados,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchEstados,
    createEstadoPresupuesto,
    updateEstadoPresupuesto,
    toggleEstadoPresupuestoStatus,
    deleteEstadoPresupuesto,
    restoreEstadoPresupuesto,
    setEstados,
    setSearchTerm,
    setShowInactive,
  };
}