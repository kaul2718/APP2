'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface TipoActividadTecnica {
  id: number;
  nombre: string;
  estado: boolean;
}

export interface OrderActividad {
  id: number;
  workOrderNumber: string;
}

export interface ActividadTecnica {
  id: number;
  diagnostico: string;
  trabajoRealizado: string;
  fecha: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  orden: OrderActividad;
  tipoActividad: TipoActividadTecnica;
}

interface PaginatedActividadResponse {
  items: ActividadTecnica[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useActividadTecnica() {
  const { data: session, status } = useSession();
  const [actividades, setActividades] = useState<ActividadTecnica[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchActividades = async (
    page: number = 1,
    limit: number = 10000,
    search: string = "",
    includeInactive: boolean = false
  ) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/actividades-tecnicas/all?page=${page}&limit=${limit}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      // Modificación importante aquí:
      // Solo agregar includeInactive si es true
      if (includeInactive) {
        url += `&includeInactive=true`;
      } else {
        // Forzar a mostrar solo activos cuando el checkbox está desmarcado
        url += `&estado=true`;
      }

      console.log("URL de solicitud:", url); // Para debug

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: PaginatedActividadResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setActividades(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener actividades técnicas:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar actividades técnicas");
      setActividades([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActividadesByOrder = async (ordenId: number) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/actividades-tecnicas/por-orden/${ordenId}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: ActividadTecnica[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error al obtener actividades por orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar actividades por orden");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // En tu hook, modifica estas funciones:

  const createActividad = async (actividadData: {
    ordenId: number;
    tipoActividadId: number;
    diagnostico: string;
    trabajoRealizado: string;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/actividades-tecnicas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(actividadData),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const newActividad = await response.json();
      toast.success("Actividad técnica creada exitosamente");

      // Actualiza la lista después de crear
      await fetchActividades(currentPage, 10000, searchTerm, showInactive);

      return newActividad;
    } catch (error) {
      console.error("Error al crear actividad técnica:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear actividad técnica");
      throw error;
    }
  };

  const updateActividad = async (
    id: number,
    actividadData: {
      diagnostico?: string;
      trabajoRealizado?: string;
      tipoActividadId?: number;
      ordenId?: number;
      estado?: boolean;
    }
  ) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/actividades-tecnicas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(actividadData),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const updatedActividad = await response.json();
      toast.success("Actividad técnica actualizada exitosamente");

      // Actualiza la lista después de modificar
      await fetchActividades(currentPage, 10000, searchTerm, showInactive);

      return updatedActividad;
    } catch (error) {
      console.error("Error al actualizar actividad técnica:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar actividad técnica");
      throw error;
    }
  };

  const toggleActividadStatus = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/actividades-tecnicas/${id}/toggle-estado`,
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

      const updatedActividad = await response.json();
      toast.success(
        `Actividad técnica ${updatedActividad.estado ? 'activada' : 'desactivada'} exitosamente`
      );
      return updatedActividad;
    } catch (error) {
      console.error("Error al cambiar estado de la actividad técnica:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al cambiar estado de la actividad técnica"
      );
      throw error;
    }
  };

  const deleteActividad = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/actividades-tecnicas/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Actividad técnica eliminada exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar actividad técnica:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar actividad técnica");
      throw error;
    }
  };

  const restoreActividad = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/actividades-tecnicas/${id}/restore`,
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

      toast.success("Actividad técnica restaurada exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar actividad técnica:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar actividad técnica");
      throw error;
    }
  };

  useEffect(() => {
    console.log("Estado de autenticación:", status);
    console.log("Token de sesión:", session?.accessToken ? "Disponible" : "No disponible");

    if (status === "authenticated") {
      console.log("Iniciando carga inicial de actividades");
      fetchActividades(1, 10000, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);
  return {
    actividades,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchActividades,
    fetchActividadesByOrder,
    createActividad,
    updateActividad,
    toggleActividadStatus,
    deleteActividad,
    restoreActividad,
    setActividades,
    setSearchTerm,
    setShowInactive,
  };
}