'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";

// Interfaz de Marca actualizada con estado booleano
export interface Marca {
  id: number;
  nombre: string;
  estado: boolean; // ← Usamos estado en vez de deletedAt
  createdAt: string;
  updatedAt: string;
}

export function useMarcas(autoFetch: boolean = true) {
  const { status } = useSession();
  const {
    items: marcas,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive: showDisabled,
    fetchItems,
    setItems: setMarcas,
    setSearchTerm,
    setShowInactive: setShowDisabled,
  } = useCrud<Marca, never, never>('/marcas', {
    defaultLimit: 10,
    listPath: '/marcas/all',
    messages: {
      loadError: 'Error al cargar marcas',
    },
  });

  const fetchMarcas = async (
    page: number = 1,
    limit: number = 10,
    search: string = "",
    includeInactive: boolean = false
  ) => {
    await fetchItems(page, limit, search, includeInactive);
  };

  useEffect(() => {
    if (autoFetch && status === "authenticated") {
      fetchMarcas(1, 10, searchTerm, showDisabled);
    }
  }, [status, searchTerm, showDisabled, autoFetch]);

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
