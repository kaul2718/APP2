'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface ParteRepuesto {
  id: number;
  nombre: string;
}

export interface DetalleRepuesto {
  id: number;
  // Agrega aquí los campos necesarios de DetalleRepuestos
}

export interface Repuesto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: boolean;
  precioVenta: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  parte: ParteRepuesto | null;
  detallesRepuestos?: DetalleRepuesto[];
}

// Respuesta paginada del backend
interface PaginatedRepuestoResponse {
  items: Repuesto[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useRepuesto() {
  const { data: session, status } = useSession();
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchRepuestos = async (
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos/all?page=${page}&limit=${limit}`;

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

      const data: PaginatedRepuestoResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setRepuestos(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener repuestos:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar repuestos");
      setRepuestos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRepuestos = async (includeInactive: boolean = false) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos?includeInactive=${includeInactive}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: Repuesto[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Formato de respuesta inválido");
      }

      return data;
    } catch (error) {
      console.error("Error al obtener repuestos:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar repuestos");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createRepuesto = async (repuestoData: { 
    codigo: string; 
    nombre: string; 
    descripcion: string; 
    precioVenta: number; 
    parteId: number 
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(repuestoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const newRepuesto = await response.json();
      toast.success("Repuesto creado exitosamente");
      return newRepuesto;
    } catch (error) {
      console.error("Error al crear repuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear repuesto");
      throw error;
    }
  };

  const updateRepuesto = async (
    id: number, 
    repuestoData: { 
      codigo?: string; 
      nombre?: string; 
      descripcion?: string; 
      precioVenta?: number; 
      parteId?: number; 
      estado?: boolean 
    }
  ) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(repuestoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const updatedRepuesto = await response.json();
      toast.success("Repuesto actualizado exitosamente");
      return updatedRepuesto;
    } catch (error) {
      console.error("Error al actualizar repuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar repuesto");
      throw error;
    }
  };

  const toggleRepuestoStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedRepuesto = await response.json();
      toast.success(`Repuesto ${updatedRepuesto.estado ? 'activado' : 'desactivado'} exitosamente`);
      return updatedRepuesto;
    } catch (error) {
      console.error("Error al cambiar estado del repuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del repuesto");
      throw error;
    }
  };

  const deleteRepuesto = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos/${id}`, {
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
      toast.success(result.message || "Repuesto eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar repuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar repuesto");
      throw error;
    }
  };

  const restoreRepuesto = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      toast.success(result.message || "Repuesto restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar repuesto:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar repuesto");
      throw error;
    }
  };

  const fetchRepuestoByCodigo = async (codigo: string, includeInactive: boolean = false) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos/codigo/${codigo}?includeInactive=${includeInactive}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const repuesto: Repuesto = await response.json();
      return repuesto;
    } catch (error) {
      console.error("Error al obtener repuesto por código:", error);
      toast.error(error instanceof Error ? error.message : "Error al buscar repuesto");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchRepuestos(1, 10, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    repuestos,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchRepuestos,
    fetchAllRepuestos,
    createRepuesto,
    updateRepuesto,
    toggleRepuestoStatus,
    deleteRepuesto,
    restoreRepuesto,
    fetchRepuestoByCodigo,
    setRepuestos,
    setSearchTerm,
    setShowInactive,
  };
}