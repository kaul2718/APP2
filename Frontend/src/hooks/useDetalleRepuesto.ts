'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface DetalleRepuesto {
  id: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  fechaUso: Date;
  estado: boolean;
  comentario: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  presupuestoId: number | null;
  orderId: number | null;
  repuestoId: number;
  repuesto?: Repuesto;
  presupuesto?: Presupuesto;
  order?: Order;
}

export interface Repuesto {
  id: number;
  codigo: string;
  nombre: string;
  precioVenta: number;
  parteId: number;
  parte?: Parte;
}

export interface Parte {
  id: number;
  nombre: string;
}

export interface Presupuesto {
  id: number;
  ordenId: number;
  estadoId: number;
  descripcion: string | null;
}

export interface Order {
  id: number;
  workOrderNumber: string;
}

// Respuesta paginada del backend
interface PaginatedDetalleRepuestoResponse {
  items: DetalleRepuesto[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useDetalleRepuesto() {
  const { data: session, status } = useSession();
  const [detalles, setDetalles] = useState<DetalleRepuesto[]>([]);
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos/all?page=${page}&limit=${limit}`;

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

      const data: PaginatedDetalleRepuestoResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setDetalles(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener detalles de repuestos:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar detalles");
      setDetalles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetallesByPresupuesto = async (presupuestoId: number, includeInactive: boolean = false) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos/by-presupuesto/${presupuestoId}?includeInactive=${includeInactive}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const detalles: DetalleRepuesto[] = await response.json();
      return detalles;
    } catch (error) {
      console.error("Error al obtener detalles por presupuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar detalles");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchDetallesByOrder = async (orderId: number, includeInactive: boolean = false) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos/by-orden/${orderId}?includeInactive=${includeInactive}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const detalles: DetalleRepuesto[] = await response.json();
      return detalles;
    } catch (error) {
      console.error("Error al obtener detalles por orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar detalles");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createDetalle = async (detalleData: {
    repuestoId: number;
    cantidad: number;
    presupuestoId?: number;
    comentario?: string;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos`, {
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
      toast.success("Detalle de repuesto creado exitosamente");
      return newDetalle;
    } catch (error) {
      console.error("Error al crear detalle de repuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear detalle");
      throw error;
    }
  };

  const updateDetalle = async (
    id: number,
    detalleData: {
      repuestoId?: number;
      cantidad?: number;
      presupuestoId?: number;
      orderId?: number;
      comentario?: string;
      estado?: boolean;
    }
  ) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos/${id}`, {
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
      toast.success("Detalle de repuesto actualizado exitosamente");
      return updatedDetalle;
    } catch (error) {
      console.error("Error al actualizar detalle de repuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar detalle");
      throw error;
    }
  };

  const toggleDetalleStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedDetalle = await response.json();
      toast.success(`Detalle ${updatedDetalle.estado ? 'activado' : 'desactivado'} exitosamente`);
      return updatedDetalle;
    } catch (error) {
      console.error("Error al cambiar estado del detalle:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
      throw error;
    }
  };

  const deleteDetalle = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const result = await response.json();
      toast.success(result.message || "Detalle eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar detalle:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar detalle");
      throw error;
    }
  };

  const restoreDetalle = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      toast.success(result.message || "Detalle restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar detalle:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar detalle");
      throw error;
    }
  };

  const calculateTotalByPresupuesto = async (presupuestoId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos/by-presupuesto/${presupuestoId}/total`,
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
      console.error("Error al calcular total por presupuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al calcular total");
      throw error;
    }
  };

  const calculateTotalByOrder = async (orderId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos/by-orden/${orderId}/total`,
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
      console.error("Error al calcular total por orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al calcular total");
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
    fetchDetallesByOrder,
    createDetalle,
    updateDetalle,
    toggleDetalleStatus,
    deleteDetalle,
    restoreDetalle,
    calculateTotalByPresupuesto,
    calculateTotalByOrder,
    setDetalles,
    setSearchTerm,
    setShowInactive,
  };
}