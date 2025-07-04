'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface Equipo {
  id: number;
  numeroSerie: string;
  estado: boolean;
  tipoEquipo: {
    id: number;
    nombre: string;
  } | null;
  marca: {
    id: number;
    nombre: string;
  } | null; // Asegúrate que marca puede ser null
  modelo: {
    id: number;
    nombre: string;
  } | null; // Asegúrate que modelo puede ser null
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface PaginatedEquipoResponse {
  items: Equipo[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

interface UseEquiposReturn {
  equipos: Equipo[];
  loading: boolean;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  searchTerm: string;
  showInactive: boolean;
  fetchEquipos: (
    page?: number,
    limit?: number,
    search?: string,
    includeInactive?: boolean
  ) => Promise<void>;
  setEquipos: React.Dispatch<React.SetStateAction<Equipo[]>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setShowInactive: React.Dispatch<React.SetStateAction<boolean>>;
  toggleEstado: (equipo: Equipo) => Promise<void>;
  createEquipo: (equipoData: any) => Promise<Equipo | undefined>;
  updateEquipo: (id: number, equipoData: any) => Promise<Equipo | undefined>;
  deleteEquipo: (id: number) => Promise<boolean>;
  restoreEquipo: (id: number) => Promise<boolean>;
}

export function useEquipos(): UseEquiposReturn {
  const { data: session, status } = useSession();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchEquipos = async (
    page: number = 1,
    limit: number = 10,
    search: string = "",
    includeInactive: boolean = false
  ) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("No hay sesión activa");
      }

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/all?page=${page}&limit=${limit}`;

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

      const data: PaginatedEquipoResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setEquipos(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error fetching equipos:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar equipos");
      setEquipos([]);
    } finally {
      setLoading(false);
    }
  };

  const createEquipo = async (equipoData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(equipoData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const newEquipo = await response.json();
      toast.success("Equipo creado exitosamente");
      fetchEquipos(currentPage, 10, searchTerm, showInactive);
      return newEquipo;
    } catch (error) {
      console.error("Error al crear equipo:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear equipo");
      throw error;
    }
  };

  const updateEquipo = async (id: number, equipoData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(equipoData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedEquipo = await response.json();
      toast.success("Equipo actualizado exitosamente");
      fetchEquipos(currentPage, 10, searchTerm, showInactive);
      return updatedEquipo;
    } catch (error) {
      console.error("Error al actualizar equipo:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar equipo");
      throw error;
    }
  };

  const toggleEstado = async (equipo: Equipo) => {
    try {
      if (!session?.accessToken) {
        throw new Error("No hay sesión activa");
      }

      const nuevoEstado = !equipo.estado;
      const accion = nuevoEstado ? "habilitar" : "deshabilitar";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${equipo.id}/toggle-estado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          // Asegúrate de enviar el estado como cuerpo de la petición
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      toast.success(`Equipo ${accion}ado correctamente`);
      // Forzar recarga de datos
      fetchEquipos(currentPage, 10, searchTerm, showInactive);
    } catch (error) {
      console.error(`Error al cambiar estado del equipo:`, error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
    }
  };

  const deleteEquipo = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Equipo eliminado exitosamente");
      fetchEquipos(currentPage, 10, searchTerm, showInactive);
      return true;
    } catch (error) {
      console.error("Error al eliminar equipo:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar equipo");
      throw error;
    }
  };

  const restoreEquipo = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Equipo restaurado exitosamente");
      fetchEquipos(currentPage, 10, searchTerm, showInactive);
      return true;
    } catch (error) {
      console.error("Error al restaurar equipo:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar equipo");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchEquipos(1, 10, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    equipos,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchEquipos,
    setEquipos,
    setSearchTerm,
    setShowInactive,
    toggleEstado,
    createEquipo,
    updateEquipo,
    deleteEquipo,
    restoreEquipo,
  };
}