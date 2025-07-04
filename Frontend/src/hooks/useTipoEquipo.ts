'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

// Interfaz de TipoEquipo
export interface TipoEquipo {
  id: number;
  nombre: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Si tu backend responde con paginación
interface PaginatedTipoEquipoResponse {
  items: TipoEquipo[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useTipoEquipo() {
  const { data: session, status } = useSession();
  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const fetchTiposEquipo = async (
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

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-equipo/all?page=${page}&limit=${limit}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      if (!includeInactive) {
        url += `&estado=true`; // Solo activos
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: PaginatedTipoEquipoResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setTiposEquipo(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener tipos de equipo:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar tipos de equipo");
      setTiposEquipo([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchTiposEquipo(1, 10, searchTerm, showInactive);
    }
  }, [status, session, searchTerm, showInactive]);

  return {
    tiposEquipo,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchTiposEquipo,
    setTiposEquipo,
    setSearchTerm,
    setShowInactive,
  };
}
