'use client';

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

export interface Cliente {
  id: number;
  nombre: string;
  cedula: string;
  correo: string;
  role: string;
  estado: boolean;
  deletedAt: string | null;
  telefono: string;
  direccion: string;
  ciudad: string;
  imagen?: string;
}

interface PaginatedResponse {
  items: Cliente[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

interface UseClientesReturn {
  clientes: Cliente[];
  loading: boolean;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  searchTerm: string;
  showDisabled: boolean;
  fetchClientes: (
    page?: number,
    limit?: number,
    search?: string,
    includeDisabled?: boolean
  ) => Promise<void>;
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setShowDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  toggleEstado: (cliente: Cliente) => Promise<void>;
}

export function useClientes(): UseClientesReturn {
  const { data: session, status } = useSession();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDisabled, setShowDisabled] = useState<boolean>(false);

  const fetchClientes = async (
    page: number = 1,
    limit: number = 10,
    search: string = "",
    includeDisabled: boolean = false
  ) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("No hay sesión activa");
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(includeDisabled && { includeDisabled: 'true' })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/all?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: PaginatedResponse = await response.json();

      setClientes(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);

    } catch (error) {
      console.error("Error fetching clientes:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar clientes");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (cliente: Cliente) => {
    try {
      if (!session?.accessToken) {
        throw new Error("No hay sesión activa");
      }

      const nuevoEstado = !cliente.estado;
      const accion = nuevoEstado ? "habilitar" : "deshabilitar";

      const confirmacion = confirm(`¿Estás seguro de ${accion} este cliente?`);
      if (!confirmacion) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${cliente.id}/toggle-estado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success(`Cliente ${accion}ado correctamente`);
      fetchClientes(currentPage, 10, searchTerm, showDisabled);
    } catch (error) {
      console.error("Error al cambiar estado del cliente:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchClientes(1, 10, searchTerm, showDisabled);
    }
  }, [status, session, searchTerm, showDisabled]);

  return {
    clientes,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showDisabled,
    fetchClientes,
    setClientes,
    setSearchTerm,
    setShowDisabled,
    toggleEstado,
  };
}