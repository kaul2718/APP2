'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface CategoriaParte {
  id: number;
  nombre: string;
}

export interface MarcaParte {
  id: number;
  nombre: string;
}

export interface EspecificacionParte {
  id: number;
  valor: string;
}

export interface InventarioParte {
  id: number;
  cantidad: number;
}

export interface Parte {
  id: number;
  nombre: string; // Nuevo campo
  modelo: string;
  descripcion: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categoria: CategoriaParte | null;
  marca: MarcaParte | null;
  especificaciones?: EspecificacionParte[];
  inventarios?: InventarioParte[];
}

// Respuesta paginada del backend
interface PaginatedParteResponse {
  items: Parte[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function usePartes() {
  const { data: session, status } = useSession();
  const [partes, setPartes] = useState<Parte[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchPartes = async (
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/partes/all?page=${page}&limit=${limit}`;

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

      const data: PaginatedParteResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setPartes(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener partes:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar partes");
      setPartes([]);
    } finally {
      setLoading(false);
    }
  };

  const createParte = async (parteData: {
    nombre: string; // Nuevo campo
    modelo: string;
    descripcion: string;
    categoriaId: number;
    marcaId: number;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(parteData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const newParte = await response.json();
      toast.success("Parte creada exitosamente");
      return newParte;
    } catch (error) {
      console.error("Error al crear parte:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear parte");
      throw error;
    }
  };

  const updateParte = async (id: number, parteData: {
    nombre?: string; // Nuevo campo
    modelo?: string;
    descripcion?: string;
    categoriaId?: number;
    marcaId?: number;
    estado?: boolean;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(parteData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedParte = await response.json();
      toast.success("Parte actualizada exitosamente");
      return updatedParte;
    } catch (error) {
      console.error("Error al actualizar parte:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar parte");
      throw error;
    }
  };

  const toggleParteStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedParte = await response.json();
      toast.success(`Parte ${updatedParte.estado ? 'activada' : 'desactivada'} exitosamente`);
      return updatedParte;
    } catch (error) {
      console.error("Error al cambiar estado de la parte:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado de la parte");
      throw error;
    }
  };

  const deleteParte = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Parte eliminada exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar parte:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar parte");
      throw error;
    }
  };

  const restoreParte = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Parte restaurada exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar parte:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar parte");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchPartes(1, 10, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    partes,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchPartes,
    createParte,
    updateParte,
    toggleParteStatus,
    deleteParte,
    restoreParte,
    setPartes,
    setSearchTerm,
    setShowInactive,
  };
}