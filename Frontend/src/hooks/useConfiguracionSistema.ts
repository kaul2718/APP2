'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

export interface ConfiguracionSistema {
  id: number;
  ordenPrefijo: string;
  ordenSiguienteNumero: number;
  ordenDigitos: number;
  ordenPermitirReinicio: boolean;
  presupuestoPrefijo: string;
  presupuestoSiguienteNumero: number;
  presupuestoDigitos: number;
  nombreEmpresa: string;
  nombreComercial: string;
  ruc: string;
  telefono: string;
  whatsapp: string;
  correoContacto: string;
  direccion: string;
  ciudad: string;
  slogan: string;
  logoUrl?: string | null;
  diasAbandono: number;
  diasGarantiaDefault: number;
  terminosRecepcion: string;
  terminosEntrega: string;
  porcentajeIva: number;
  diasVigenciaPresupuesto: number;
  tiempoLimiteDiagnosticoHoras: number;
  diasAlertaControlRetiro: number;
  stockMinimoAlertaGlobal: number;
  plantillaWhatsappRecepcion: string;
  plantillaWhatsappListoEntrega: string;
  updatedAt: string;
}

export function useConfiguracionSistema() {
  const { data: session } = useSession();
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfiguracion = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/configuracion-sistema`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error('No se pudo obtener la configuración del sistema');
      }

      const data: ConfiguracionSistema = await res.json();
      setConfiguracion(data);
    } catch (err: any) {
      const msg = err.message || 'Error al cargar la configuración';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchConfiguracion();
  }, [fetchConfiguracion]);

  const actualizarConfiguracion = async (
    datos: Partial<ConfiguracionSistema>,
  ): Promise<boolean> => {
    if (!session?.accessToken) {
      toast.error('Sesión no válida o expirada');
      return false;
    }

    try {
      setSaving(true);

      const camposPermitidos = [
        'ordenPrefijo',
        'ordenSiguienteNumero',
        'ordenDigitos',
        'ordenPermitirReinicio',
        'presupuestoPrefijo',
        'presupuestoSiguienteNumero',
        'presupuestoDigitos',
        'nombreEmpresa',
        'nombreComercial',
        'ruc',
        'telefono',
        'whatsapp',
        'correoContacto',
        'direccion',
        'ciudad',
        'slogan',
        'diasAbandono',
        'diasGarantiaDefault',
        'terminosRecepcion',
        'terminosEntrega',
        'porcentajeIva',
        'diasVigenciaPresupuesto',
        'tiempoLimiteDiagnosticoHoras',
        'diasAlertaControlRetiro',
        'stockMinimoAlertaGlobal',
        'plantillaWhatsappRecepcion',
        'plantillaWhatsappListoEntrega',
      ];

      const camposNumericos = [
        'ordenSiguienteNumero',
        'ordenDigitos',
        'presupuestoSiguienteNumero',
        'presupuestoDigitos',
        'diasAbandono',
        'diasGarantiaDefault',
        'porcentajeIva',
        'diasVigenciaPresupuesto',
        'tiempoLimiteDiagnosticoHoras',
        'diasAlertaControlRetiro',
        'stockMinimoAlertaGlobal',
      ];

      const payload: Record<string, any> = {};

      for (const campo of camposPermitidos) {
        if ((datos as any)[campo] !== undefined) {
          const val = (datos as any)[campo];
          if (camposNumericos.includes(campo)) {
            const num = Number(val);
            if (!isNaN(num)) {
              payload[campo] = num;
            }
          } else {
            payload[campo] = val;
          }
        }
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/configuracion-sistema`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const json = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(json.message) ? json.message.join(', ') : json.message;
        throw new Error(msg || 'Error al guardar la configuración');
      }

      setConfiguracion(json);
      toast.success('Configuración actualizada exitosamente ✅');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar configuración');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const subirLogo = async (file: File): Promise<string | null> => {
    if (!session?.accessToken) {
      toast.error('Sesión no válida');
      return null;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/configuracion-sistema/logo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: formData,
        },
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Error al subir el logo');
      }

      toast.success('Logo corporativo actualizado con éxito');
      if (json.logoUrl && configuracion) {
        setConfiguracion({ ...configuracion, logoUrl: json.logoUrl });
      }
      return json.logoUrl;
    } catch (err: any) {
      toast.error(err.message || 'No se pudo subir el logo');
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  return {
    configuracion,
    loading,
    saving,
    uploadingLogo,
    error,
    refetch: fetchConfiguracion,
    actualizarConfiguracion,
    subirLogo,
  };
}
