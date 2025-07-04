'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

// Interfaz de Marca actualizada con estado booleano
export interface Marca {
  id: number;
  nombre: string;
  estado: boolean; // ← Usamos estado en vez de deletedAt
  createdAt: string;
  updatedAt: string;
}

// Si tu backend responde con paginación
interface PaginatedMarcaResponse {
  items: Marca[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useMarcas() {
  const { data: session, status } = useSession();
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDisabled, setShowDisabled] = useState<boolean>(false); // Mostrar inactivas

  const fetchMarcas = async (
    page: number = 1,
    limit: number = 1000,
    search: string = "",
    includeInactive: boolean = false
  ) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/marcas/all?page=${page}&limit=${limit}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      if (!includeInactive) {
        url += `&estado=true`; // Solo activas
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: PaginatedMarcaResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setMarcas(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener marcas:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar marcas");
      setMarcas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchMarcas(1, 1000, searchTerm, showDisabled);
    }
  }, [status, session, searchTerm, showDisabled]);

  return {
    marcas,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showDisabled,
    fetchMarcas,
    setMarcas,
    setSearchTerm,
    setShowDisabled,
  };
}
