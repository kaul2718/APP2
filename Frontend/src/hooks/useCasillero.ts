'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface OrderCasillero {
  id: number;
  workOrderNumber: string;
}

export interface Casillero {
  id: number;
  codigo: string;
  descripcion: string;
  situacion: 'Ocupado' | 'Disponible';
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  order?: OrderCasillero | null;
}

// Respuesta paginada del backend
interface PaginatedCasilleroResponse {
  items: Casillero[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useCasillero() {
  const { data: session, status } = useSession();
  const [casilleros, setCasilleros] = useState<Casillero[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [situacionFilter, setSituacionFilter] = useState<string | undefined>();

  const fetchCasilleros = async (
    page: number = 1,
    limit: number = 10,
    search: string = "",
    includeInactive: boolean = false,
    situacion?: string
  ) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/all?page=${page}&limit=${limit}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      if (includeInactive) {
        url += `&includeInactive=true`;
      }

      if (situacion) {
        url += `&situacion=${encodeURIComponent(situacion)}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: PaginatedCasilleroResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setCasilleros(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener casilleros:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar casilleros");
      setCasilleros([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCasilleros = async () => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/disponibles`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: Casillero[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error al obtener casilleros disponibles:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar casilleros disponibles");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createCasillero = async (casilleroData: { codigo: string; descripcion: string }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(casilleroData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const newCasillero = await response.json();
      toast.success("Casillero creado exitosamente");
      return newCasillero;
    } catch (error) {
      console.error("Error al crear casillero:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear casillero");
      throw error;
    }
  };

  const updateCasillero = async (id: number, casilleroData: { codigo?: string; descripcion?: string; estado?: boolean }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(casilleroData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedCasillero = await response.json();
      toast.success("Casillero actualizado exitosamente");
      return updatedCasillero;
    } catch (error) {
      console.error("Error al actualizar casillero:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar casillero");
      throw error;
    }
  };

  const toggleCasilleroStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedCasillero = await response.json();
      toast.success(`Casillero ${updatedCasillero.estado ? 'activado' : 'desactivado'} exitosamente`);
      return updatedCasillero;
    } catch (error) {
      console.error("Error al cambiar estado del casillero:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del casillero");
      throw error;
    }
  };

  const deleteCasillero = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Casillero eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar casillero:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar casillero");
      throw error;
    }
  };

  const restoreCasillero = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Casillero restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar casillero:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar casillero");
      throw error;
    }
  };

  const assignOrder = async (casilleroId: number, orderId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/${casilleroId}/asignar-orden/${orderId}`,
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

      const updatedCasillero = await response.json();
      toast.success("Orden asignada al casillero exitosamente");
      return updatedCasillero;
    } catch (error) {
      console.error("Error al asignar orden al casillero:", error);
      toast.error(error instanceof Error ? error.message : "Error al asignar orden al casillero");
      throw error;
    }
  };

  const releaseCasillero = async (casilleroId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/${casilleroId}/liberar`,
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

      const updatedCasillero = await response.json();
      toast.success("Casillero liberado exitosamente");
      return updatedCasillero;
    } catch (error) {
      console.error("Error al liberar casillero:", error);
      toast.error(error instanceof Error ? error.message : "Error al liberar casillero");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCasilleros(1, 10, searchTerm, showInactive, situacionFilter);
    }
  }, [status, session, searchTerm, showInactive, situacionFilter]);

  return {
    casilleros,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    situacionFilter,
    fetchCasilleros,
    fetchAvailableCasilleros,
    createCasillero,
    updateCasillero,
    toggleCasilleroStatus,
    deleteCasillero,
    restoreCasillero,
    assignOrder,
    releaseCasillero,
    setCasilleros,
    setSearchTerm,
    setShowInactive,
    setSituacionFilter,
  };
}