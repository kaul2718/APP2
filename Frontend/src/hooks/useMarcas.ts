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

export function useMarcas() {
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
    defaultLimit: 1000,
    listPath: '/marcas/all',
    messages: {
      loadError: 'Error al cargar marcas',
    },
  });

  const fetchMarcas = async (
    page: number = 1,
    limit: number = 1000,
    search: string = "",
    includeInactive: boolean = false
  ) => {
    await fetchItems(page, limit, search, includeInactive, includeInactive ? undefined : { estado: true });
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchMarcas(1, 1000, searchTerm, showDisabled);
    }
  }, [status, searchTerm, showDisabled]);

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
