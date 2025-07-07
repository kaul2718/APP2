'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface DetalleManoObra {
  id: number;
  presupuestoId: number;
  tipoManoObraId: number;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tipoManoObra?: TipoManoObra;
  presupuesto?: Presupuesto;
}

export interface TipoManoObra {
  id: number;
  nombre: string;
  codigo: string;
  costo: number;
  estado: boolean;
}

export interface Presupuesto {
  id: number;
  ordenId: number;
  estadoId: number;
  descripcion: string;
  fechaEmision: string;
}

interface PaginatedDetalleManoObraResponse {
  items: DetalleManoObra[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

interface ResumenManoObra {
  totalManoObra: number;
  cantidadItems: number;
  detalles: DetalleManoObra[];
}

export function useDetalleManoObra() {
  const { data: session, status } = useSession();
  const [detalles, setDetalles] = useState<DetalleManoObra[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchDetalles = async (
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-mano-obra/all?page=${page}&limit=${limit}`;

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

      const data: PaginatedDetalleManoObraResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setDetalles(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener detalles de mano de obra:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar detalles");
      setDetalles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetallesByPresupuesto = async (
    presupuestoId: number,
    includeInactive: boolean = false
  ) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-mano-obra/by-presupuesto/${presupuestoId}`;

      if (includeInactive) {
        url += `?includeInactive=true`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: DetalleManoObra[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Formato de respuesta inválido");
      }

      setDetalles(data);
    } catch (error) {
      console.error("Error al obtener detalles por presupuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar detalles");
      setDetalles([]);
    } finally {
      setLoading(false);
    }
  };

  const getResumenManoObra = async (presupuestoId: number): Promise<ResumenManoObra> => {
    try {
      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-mano-obra/by-presupuesto/${presupuestoId}/total`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener resumen de mano de obra:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar resumen");
      throw error;
    }
  };

  const createDetalle = async (detalleData: {
    presupuestoId: number;
    tipoManoObraId: number;
    cantidad: number;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-mano-obra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(detalleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const newDetalle = await response.json();
      toast.success("Detalle de mano de obra creado exitosamente");
      return newDetalle;
    } catch (error) {
      console.error("Error al crear detalle:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear detalle");
      throw error;
    }
  };

  const updateDetalle = async (
    id: number,
    detalleData: {
      presupuestoId?: number;
      tipoManoObraId?: number;
      cantidad?: number;
      estado?: boolean;
    }
  ) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-mano-obra/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(detalleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const updatedDetalle = await response.json();
      toast.success("Detalle actualizado exitosamente");
      return updatedDetalle;
    } catch (error) {
      console.error("Error al actualizar detalle:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar detalle");
      throw error;
    }
  };

  const toggleDetalleStatus = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-mano-obra/${id}/toggle-estado`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedDetalle = await response.json();
      return updatedDetalle;
    } catch (error) {
      console.error("Error al cambiar estado del detalle:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
      throw error;
    }
  };

  const deleteDetalle = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-mano-obra/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Detalle eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar detalle:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar detalle");
      throw error;
    }
  };

  const restoreDetalle = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-mano-obra/${id}/restore`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Detalle restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar detalle:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar detalle");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchDetalles(1, 10, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    detalles,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchDetalles,
    fetchDetallesByPresupuesto,
    getResumenManoObra,
    createDetalle,
    updateDetalle,
    toggleDetalleStatus,
    deleteDetalle,
    restoreDetalle,
    setDetalles,
    setSearchTerm,
    setShowInactive,
  };
}