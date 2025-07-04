'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface DetalleManoObra {
  id: number;
  // Agrega aquí las propiedades de DetalleManoObra si son necesarias
}

export interface TipoManoObra {
  id: number;
  nombre: string;
  codigo: string;
  estado: boolean;
  descripcion: string | null;
  costo: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  detalles?: DetalleManoObra[];
}

// Respuesta paginada del backend
interface PaginatedTipoManoObraResponse {
  items: TipoManoObra[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useTipoManoObra() {
  const { data: session, status } = useSession();
  const [tipos, setTipos] = useState<TipoManoObra[]>([]);
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-mano-obra?page=${page}&limit=${limit}`;

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

      const data: PaginatedTipoManoObraResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setTipos(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener tipos de mano de obra:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar tipos de mano de obra");
      setTipos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTipos = async (includeInactive: boolean = false) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-mano-obra/all`;

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

      const data: TipoManoObra[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Formato de respuesta inválido");
      }

      setTipos(data);
    } catch (error) {
      console.error("Error al obtener todos los tipos de mano de obra:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar tipos de mano de obra");
      setTipos([]);
    } finally {
      setLoading(false);
    }
  };

  const createTipo = async (tipoData: {
    nombre: string;
    codigo: string;
    descripcion?: string;
    costo: number;
    estado?: boolean;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-mano-obra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(tipoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const newTipo = await response.json();
      toast.success("Tipo de mano de obra creado exitosamente");
      return newTipo;
    } catch (error) {
      console.error("Error al crear tipo de mano de obra:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear tipo de mano de obra");
      throw error;
    }
  };

  const updateTipo = async (
    id: number,
    tipoData: {
      nombre?: string;
      codigo?: string;
      descripcion?: string;
      costo?: number;
      estado?: boolean;
    }
  ) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-mano-obra/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(tipoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const updatedTipo = await response.json();
      toast.success("Tipo de mano de obra actualizado exitosamente");
      return updatedTipo;
    } catch (error) {
      console.error("Error al actualizar tipo de mano de obra:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar tipo de mano de obra");
      throw error;
    }
  };

  const toggleTipoStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-mano-obra/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedTipo = await response.json();
      return updatedTipo;
    } catch (error) {
      console.error("Error al cambiar estado del tipo de mano de obra:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del tipo de mano de obra");
      throw error;
    }
  };

  const deleteTipo = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-mano-obra/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Tipo de mano de obra eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar tipo de mano de obra:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar tipo de mano de obra");
      throw error;
    }
  };

  const restoreTipo = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-mano-obra/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Tipo de mano de obra restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar tipo de mano de obra:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar tipo de mano de obra");
      throw error;
    }
  };

  const getTipoByCodigo = async (codigo: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-mano-obra/codigo/${codigo}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener tipo por código:", error);
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
    fetchAllTipos,
    createTipo,
    updateTipo,
    toggleTipoStatus,
    deleteTipo,
    restoreTipo,
    getTipoByCodigo,
    setTipos,
    setSearchTerm,
    setShowInactive,
  };
}