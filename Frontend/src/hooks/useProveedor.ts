import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { apiRequest } from "@/lib/api";

export interface Proveedor {
  id: number;
  nombre: string;
  ruc_nit: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  estado: boolean;
}

export function useProveedor() {
  const { data: session } = useSession();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchProveedores = useCallback(
    async (page = 1, limit = 10, search = "") => {
      if (!session?.accessToken) return;
      try {
        setLoading(true);
        const url = `/proveedor?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
        const res = await apiRequest<any>(url, {}, session);
        if (res && Array.isArray(res.items)) {
          setProveedores(res.items);
          setTotal(res.total);
        }
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  const fetchActiveProveedores = useCallback(async (): Promise<Proveedor[]> => {
    if (!session?.accessToken) return [];
    try {
      setLoading(true);
      const res = await apiRequest<Proveedor[]>("/proveedor/active", {}, session);
      if (res && Array.isArray(res)) {
        return res;
      }
      return [];
    } catch (err) {
      console.error("Error fetching active suppliers:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [session]);

  const crearProveedor = async (data: Omit<Proveedor, "id" | "estado">) => {
    if (!session?.accessToken) return null;
    try {
      setLoading(true);
      const res = await apiRequest<Proveedor>("/proveedor", {
        method: "POST",
        body: JSON.stringify(data),
      }, session);
      return res;
    } catch (err: any) {
      throw new Error(err.message || "Error al crear proveedor.");
    } finally {
      setLoading(false);
    }
  };

  const actualizarProveedor = async (id: number, data: Partial<Proveedor>) => {
    if (!session?.accessToken) return null;
    try {
      setLoading(true);
      const res = await apiRequest<Proveedor>(`/proveedor/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }, session);
      return res;
    } catch (err: any) {
      throw new Error(err.message || "Error al actualizar proveedor.");
    } finally {
      setLoading(false);
    }
  };

  const eliminarProveedor = async (id: number) => {
    if (!session?.accessToken) return false;
    try {
      setLoading(true);
      await apiRequest<any>(`/proveedor/${id}`, {
        method: "DELETE",
      }, session);
      return true;
    } catch (err: any) {
      throw new Error(err.message || "Error al desactivar proveedor.");
    } finally {
      setLoading(false);
    }
  };

  return {
    proveedores,
    loading,
    total,
    fetchProveedores,
    fetchActiveProveedores,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
  };
}
