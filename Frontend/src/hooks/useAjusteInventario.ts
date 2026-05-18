'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { apiRequest } from '@/lib/api';

export interface AjusteDetalle {
  id: number;
  parteId: number;
  stockSistema: number;
  stockFisico: number;
  diferencia: number;
  parte: {
    id: number;
    nombre: string;
    modelo: string | null;
    codigoInterno: string | null;
    unidadMedida: string;
  };
}

export interface AjusteInventario {
  id: number;
  fecha: string;
  motivo: string;
  comentario: string | null;
  usuarioId: number;
  usuario: {
    id: number;
    nombre: string;
    correo: string;
  };
  detalles: AjusteDetalle[];
}

export function useAjusteInventario() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<AjusteInventario[]>([]);

  // Guardar un ajuste transaccional en el servidor
  const guardarAjuste = useCallback(async (
    motivo: string,
    comentario: string,
    detalles: { parteId: number; stockFisico: number }[]
  ) => {
    if (!session?.accessToken) return null;
    try {
      setLoading(true);
      const data = await apiRequest<AjusteInventario>('/ajuste-inventario', {
        method: 'POST',
        body: JSON.stringify({
          motivo,
          comentario: comentario || undefined,
          detalles,
        }),
      }, session);
      return data;
    } catch (error) {
      console.error('Error al registrar ajuste de inventario:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Cargar el historial de auditorías
  const fetchHistorial = useCallback(async () => {
    if (!session?.accessToken) return [];
    try {
      setLoading(true);
      const data = await apiRequest<AjusteInventario[]>('/ajuste-inventario', {}, session);
      setHistorial(data || []);
      return data || [];
    } catch (error) {
      console.error('Error al cargar historial de ajustes:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Cargar un ajuste individual con sus detalles
  const fetchAjusteDetalle = useCallback(async (id: number) => {
    if (!session?.accessToken) return null;
    try {
      setLoading(true);
      const data = await apiRequest<AjusteInventario>(`/ajuste-inventario/${id}`, {}, session);
      return data;
    } catch (error) {
      console.error(`Error al cargar detalle del ajuste ${id}:`, error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session]);

  return {
    loading,
    historial,
    guardarAjuste,
    fetchHistorial,
    fetchAjusteDetalle,
  };
}
