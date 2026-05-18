import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { apiRequest } from "@/lib/api";
import { Proveedor } from "./useProveedor";

export interface CompraDetalle {
  id: number;
  parteId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  actualizarCosto: boolean;
  parte?: {
    id: number;
    nombre: string;
    codigoInterno: string;
    unidadMedida: string;
  };
}

export interface Compra {
  id: number;
  numeroFactura: string;
  fecha: string;
  subtotal: number;
  ivaPorcentaje: number;
  ivaMonto: number;
  total: number;
  comentario?: string;
  estado: string; // 'Completado', 'Anulado'
  proveedorId: number;
  proveedor?: Proveedor;
  usuarioId: number;
  usuario?: {
    id: number;
    nombre: string;
  };
  detalles?: CompraDetalle[];
  createdAt: string;
}

export function useCompra() {
  const { data: session } = useSession();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchCompras = useCallback(
    async (page = 1, limit = 10, search = "") => {
      if (!session?.accessToken) return;
      try {
        setLoading(true);
        const url = `/compra?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
        const res = await apiRequest<any>(url, {}, session);
        if (res && Array.isArray(res.items)) {
          setCompras(res.items);
          setTotal(res.total);
        }
      } catch (err) {
        console.error("Error fetching purchases:", err);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  const obtenerCompra = useCallback(
    async (id: number): Promise<Compra | null> => {
      if (!session?.accessToken) return null;
      try {
        setLoading(true);
        const res = await apiRequest<Compra>(`/compra/${id}`, {}, session);
        return res;
      } catch (err) {
        console.error("Error fetching purchase detail:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  const guardarCompra = async (data: {
    numeroFactura: string;
    proveedorId: number;
    fecha: string;
    ivaPorcentaje: number;
    comentario?: string;
    detalles: Array<{
      parteId: number;
      cantidad: number;
      precioUnitario: number;
      actualizarCosto: boolean;
    }>;
  }) => {
    if (!session?.accessToken) return null;
    try {
      setLoading(true);
      const res = await apiRequest<Compra>("/compra", {
        method: "POST",
        body: JSON.stringify(data),
      }, session);
      return res;
    } catch (err: any) {
      throw new Error(err.message || "Error al registrar la compra.");
    } finally {
      setLoading(false);
    }
  };

  const anularCompra = async (id: number) => {
    if (!session?.accessToken) return null;
    try {
      setLoading(true);
      const res = await apiRequest<Compra>(`/compra/${id}/anular`, {
        method: "PATCH",
      }, session);
      return res;
    } catch (err: any) {
      throw new Error(err.message || "Error al anular la compra.");
    } finally {
      setLoading(false);
    }
  };

  return {
    compras,
    loading,
    total,
    fetchCompras,
    obtenerCompra,
    guardarCompra,
    anularCompra,
  };
}
