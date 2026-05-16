'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";

// Interfaz de TipoEquipo
export interface TipoEquipo {
  id: number;
  nombre: string;
  estado: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useTipoEquipo() {
  const { status } = useSession();
  const {
    items: tiposEquipo,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchItems,
    setItems: setTiposEquipo,
    setSearchTerm,
    setShowInactive,
  } = useCrud<TipoEquipo, never, never>('/tipos-equipo', {
    defaultLimit: 10,
    messages: {
      loadError: 'Error al cargar tipos de equipo',
    },
  });

  const fetchTiposEquipo = fetchItems;

  useEffect(() => {
    if (status === "authenticated") {
      fetchTiposEquipo(1, 10, searchTerm, showInactive);
    }
  }, [status, searchTerm, showInactive]);

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
