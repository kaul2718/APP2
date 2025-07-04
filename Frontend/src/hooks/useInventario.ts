'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface ParteInventario {
  id: number;
  nombre: string;
  modelo: string;
}

export interface Inventario {
  id: number;
  cantidad: number;
  stockMinimo: number;
  ubicacion: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  parte: ParteInventario | null; // Asegúrate que puede ser null
  parteId: number;
}

interface PaginatedInventarioResponse {
  items: Inventario[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export function useInventario() {
  const { data: session, status } = useSession();
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  const fetchInventarios = async (
    page: number = 1,
    limit: number = 10,
    search: string = "",
    includeInactive: boolean = false,
    lowStock: boolean = false
  ) => {
    try {
      setLoading(true);

      if (!session?.accessToken) {
        throw new Error("Token de sesión no disponible");
      }

      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/inventario/all?page=${page}&limit=${limit}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      if (includeInactive) {
        url += `&includeInactive=true`;
      }

      if (lowStock) {
        url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/inventario/bajo-stock?page=${page}&limit=${limit}`;
        if (search) {
          url += `&ubicacion=${encodeURIComponent(search)}`;
        }
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: PaginatedInventarioResponse = await response.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      setInventarios(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error al obtener inventarios:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar inventarios");
      setInventarios([]);
    } finally {
      setLoading(false);
    }
  };

  const createInventario = async (inventarioData: {
    parteId: number;
    cantidad: number;
    stockMinimo: number;
    ubicacion: string;
  }) => {
    try {
      setLoading(true);


      // Validación mejorada
      if (typeof inventarioData.cantidad !== 'number' ||
        inventarioData.cantidad < 0 ||
        !Number.isInteger(inventarioData.cantidad)) {
        throw new Error("La cantidad debe ser un número entero positivo");
      }

      if (typeof inventarioData.stockMinimo !== 'number' ||
        inventarioData.stockMinimo < 0 ||
        !Number.isInteger(inventarioData.stockMinimo)) {
        throw new Error("El stock mínimo debe ser un número entero positivo");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/inventario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          ...inventarioData,
          estado: true // Asegurar que siempre se cree como activo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Mejor manejo de errores del backend
        const errorMessages = errorData.message?.split(',') || [];
        const uniqueMessages = [...new Set(errorMessages)]; // Eliminar duplicados
        throw new Error(uniqueMessages.join('\n'));
      }

      const newInventario = await response.json();
      toast.success("Registro de inventario creado exitosamente");

      // Actualizar la lista de inventarios
      fetchInventarios(currentPage, 10, searchTerm, showInactive, lowStockOnly);

      return newInventario;
    } catch (error) {
      console.error("Error al crear inventario:", error);

      // Mostrar cada mensaje de error en líneas separadas
      if (error instanceof Error) {
        error.message.split('\n').forEach(msg => {
          if (msg.trim()) toast.error(msg.trim());
        });
      } else {
        toast.error("Error al crear registro de inventario");
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateInventario = async (id: number, inventarioData: {
    parteId?: number;
    cantidad?: number;
    stockMinimo?: number;
    ubicacion?: string;
    estado?: boolean;
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/inventario/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(inventarioData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const updatedInventario = await response.json();
      toast.success("Inventario actualizado exitosamente");
      return updatedInventario;
    } catch (error) {
      console.error("Error al actualizar inventario:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar inventario");
      throw error;
    }
  };

  const updateStock = async (id: number, cantidad: number, operacion: 'add' | 'subtract') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/inventario/${id}/update-stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ cantidad, operacion }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const updatedInventario = await response.json();
      toast.success("Stock actualizado exitosamente");
      return updatedInventario;
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar stock");
      throw error;
    }
  };

  const checkStock = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/inventario/${id}/check-stock`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al verificar stock:", error);
      toast.error(error instanceof Error ? error.message : "Error al verificar stock");
      throw error;
    }
  };

  const toggleInventarioStatus = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/inventario/${id}/toggle-estado`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const updatedInventario = await response.json();
      toast.success(`Producto ${updatedInventario.estado ? 'activado' : 'desactivado'} exitosamente`);
      return updatedInventario;
    } catch (error) {
      console.error("Error al cambiar estado del inventario:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado del inventario");
      throw error;
    }
  };

  const deleteInventario = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/inventario/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Registro de inventario eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al eliminar inventario:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar inventario");
      throw error;
    }
  };

  const restoreInventario = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/inventario/${id}/restore`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Registro de inventario restaurado exitosamente");
      return true;
    } catch (error) {
      console.error("Error al restaurar inventario:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar inventario");
      throw error;
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchInventarios(1, 10, searchTerm, showInactive, lowStockOnly);
    }
  }, [status, session, searchTerm, showInactive, lowStockOnly]);

  return {
    inventarios,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    lowStockOnly,
    fetchInventarios,
    createInventario,
    updateInventario,
    updateStock,
    checkStock,
    toggleInventarioStatus,
    deleteInventario,
    restoreInventario,
    setInventarios,
    setSearchTerm,
    setShowInactive,
    setLowStockOnly,
  };
}