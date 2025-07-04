'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface MarcaModelo {
  id: number;
  nombre: string;
}

export interface EquipoModelo {
  id: number;
  nombre: string;
}

export interface Modelo {
  id: number;
  nombre: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  marca: MarcaModelo | null;  // Cambiado a null
  equipos?: EquipoModelo[];
}

// Respuesta paginada del backend
interface PaginatedModeloResponse {
  items: Modelo[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useModelo() {
  const { data: session, status } = useSession();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchModelos = async (
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/modelos/all?page=${page}&limit=${limit}`;

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

      const data: PaginatedModeloResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setModelos(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener modelos:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar modelos");
      setModelos([]);
    } finally {
      setLoading(false);
    }
  };

  const createModelo = async (modeloData: { nombre: string; marcaId: number }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/modelos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(modeloData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const newModelo = await response.json();
      toast.success("Modelo creado exitosamente");
      return newModelo;
    } catch (error) {
      console.error("Error al crear modelo:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear modelo");
      throw error;
    }
  };

  const updateModelo = async (id: number, modeloData: { nombre?: string; marcaId?: number; estado?: boolean }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/modelos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(modeloData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedModelo = await response.json();
      toast.success("Modelo actualizado exitosamente");
      return updatedModelo;
    } catch (error) {
      console.error("Error al actualizar modelo:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar modelo");
      throw error;
    }
  };

  const toggleModeloStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/modelos/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedModelo = await response.json();
      toast.success(`Modelo ${updatedModelo.estado ? 'activado' : 'desactivado'} exitosamente`);
      return updatedModelo;
    } catch (error) {
      console.error("Error al cambiar estado del modelo:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del modelo");
      throw error;
    }
  };

  const deleteModelo = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/modelos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Modelo eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar modelo:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar modelo");
      throw error;
    }
  };

  const restoreModelo = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/modelos/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Modelo restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar modelo:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar modelo");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchModelos(1, 10, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    modelos,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchModelos,
    createModelo,
    updateModelo,
    toggleModeloStatus,
    deleteModelo,
    restoreModelo,
    setModelos,
    setSearchTerm,
    setShowInactive,
  };
}