'use client';

import { useTipoActividadTecnica } from '@/hooks/useTipoActividadTecnica';

export function useTipoActividades() {
  const { tipos, loading, fetchTipos } = useTipoActividadTecnica();

  return {
    tiposActividades: tipos,
    loading,
    fetchTipos,
  };
}
