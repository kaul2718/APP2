'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface EstadoOrden {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ordenes?: Array<{ id: number }>;
  historialComoAnterior?: Array<{ id: number }>;
  historialComoNuevo?: Array<{ id: number }>;
}

interface PaginatedEstadoOrdenResponse {
  items: EstadoOrden[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useEstadoOrden() {
  const { data: session, status } = useSession();
  const [estadosOrden, setEstadosOrden] = useState<EstadoOrden[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchEstadosOrden = async (
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-orden/all?page=${page}&limit=${limit}`;

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

      const data: PaginatedEstadoOrdenResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setEstadosOrden(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener estados de orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar estados de orden");
      setEstadosOrden([]);
    } finally {
      setLoading(false);
    }
  };

  const createEstadoOrden = async (estadoOrdenData: { nombre: string; descripcion?: string }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-orden`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(estadoOrdenData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const newEstadoOrden = await response.json();
      toast.success("Estado de orden creado exitosamente");
      return newEstadoOrden;
    } catch (error) {
      console.error("Error al crear estado de orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear estado de orden");
      throw error;
    }
  };

  const updateEstadoOrden = async (id: number, estadoOrdenData: { nombre?: string; descripcion?: string; estado?: boolean }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-orden/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(estadoOrdenData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const updatedEstadoOrden = await response.json();
      toast.success("Estado de orden actualizado exitosamente");
      return updatedEstadoOrden;
    } catch (error) {
      console.error("Error al actualizar estado de orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar estado de orden");
      throw error;
    }
  };

  const toggleEstadoOrdenStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-orden/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const updatedEstadoOrden = await response.json();
      toast.success(`Estado de orden ${updatedEstadoOrden.estado ? 'activado' : 'desactivado'} exitosamente`);
      return updatedEstadoOrden;
    } catch (error) {
      console.error("Error al cambiar estado del estado de orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del estado de orden");
      throw error;
    }
  };

  const deleteEstadoOrden = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-orden/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      toast.success("Estado de orden eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar estado de orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar estado de orden");
      throw error;
    }
  };

  const restoreEstadoOrden = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-orden/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      toast.success("Estado de orden restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar estado de orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar estado de orden");
      throw error;
    }
  };

  const getEstadoOrdenById = async (id: number, includeInactive: boolean = false) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-orden/${id}?includeInactive=${includeInactive}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener estado de orden:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchEstadosOrden(1, 10, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    estadosOrden,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchEstadosOrden,
    createEstadoOrden,
    updateEstadoOrden,
    toggleEstadoOrdenStatus,
    deleteEstadoOrden,
    restoreEstadoOrden,
    getEstadoOrdenById,
    setEstadosOrden,
    setSearchTerm,
    setShowInactive,
  };
}