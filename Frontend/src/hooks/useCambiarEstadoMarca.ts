// src/hooks/useCambiarEstadoMarca.ts
import { toast } from "react-toastify";

export interface Marca {
  id: number;
  nombre: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface MarcaEstadoPayload {
  id: number;
  activo: boolean;
}

export function prepareCambioEstadoMarca(
  marcaId: number,
  activar: boolean
): MarcaEstadoPayload {
  return {
    id: marcaId,
    activo: activar
  };
}
export async function cambiarEstadoMarca(
  marcaId: number,
  activar: boolean,
  token: string
): Promise<Marca | null> {
  // Cambiamos la URL para que coincida con tu endpoint real
  const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/marcas/${marcaId}`;

  try {
    const response = await fetch(endpoint, {
      method: "DELETE", // Usamos DELETE para soft delete
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Si necesitas enviar algún dato en el body para distinguir entre soft delete y restore
      body: activar ? JSON.stringify({ action: 'restore' }) : undefined
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Asumimos que la respuesta incluye los datos actualizados de la marca
    const updated: Marca = {
      id: marcaId,
      nombre: data.nombre || '',
      deletedAt: activar ? null : new Date().toISOString(),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    toast.success(
      activar
        ? "Marca restaurada correctamente ✅"
        : "Marca deshabilitada correctamente ✅"
    );

    return updated;
  } catch (error: any) {
    console.error("Error al cambiar estado de la marca:", error);
    toast.error(error?.message || "Error al cambiar el estado de la marca ❌");
    return null;
  }
}