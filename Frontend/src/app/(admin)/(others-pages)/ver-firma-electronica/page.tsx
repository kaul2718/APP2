'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import {
  ShieldCheckIcon,
  KeyIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface FirmaStatus {
  configurado: boolean;
  activo?: boolean;
  expirado?: boolean;
  diasRestantes?: number;
  titularNombre?: string;
  titularCedulaRuc?: string;
  entidadEmisora?: string;
  organizacion?: string;
  fechaEmision?: string;
  fechaExpiracion?: string;
  serialNumber?: string;
  updatedAt?: string;
}

export default function FirmaElectronicaPage() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<FirmaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulario de subida
  const [archivo, setArchivo] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/firma-electronica/status`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        },
      );
      if (!res.ok) throw new Error('Error al consultar estado de firma digital');
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      console.error(err);
      toast.error('No se pudo cargar el estado de la firma electrónica.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchStatus();
    }
  }, [session]);

  const handleSubirFirma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) {
      toast.warning('Seleccione el archivo de firma (.p12 o .pfx).');
      return;
    }
    if (!password.trim()) {
      toast.warning('Ingrese la contraseña del certificado digital.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('password', password.trim());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/firma-electronica/config`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: formData,
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al validar o almacenar la firma electrónica');
      }

      toast.success(
        `✓ Firma electrónica validada y configurada exitosamente para: ${data.titularNombre || 'el Gerente'}`,
        { autoClose: 4000 },
      );
      setArchivo(null);
      setPassword('');
      setStatus(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al procesar el archivo .p12');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActivo = async (nuevoEstado: boolean) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/firma-electronica/toggle`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({ activo: nuevoEstado }),
        },
      );
      if (!res.ok) throw new Error('Error al actualizar estado');
      const data = await res.json();
      setStatus(data);
      toast.success(
        nuevoEstado
          ? 'Firma digital criptográfica activada para nuevas actas.'
          : 'Firma digital criptográfica desactivada temporalmente.',
      );
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado.');
    }
  };

  const handleTestFirma = async () => {
    try {
      setTesting(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/firma-electronica/test`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error probando firma');
      toast.success(data.mensaje || '✓ Prueba de firma digital exitosa (PAdES / FirmaEC)');
    } catch (err: any) {
      toast.error(err.message || 'Error probando firma digital');
    } finally {
      setTesting(false);
    }
  };

  const handleEliminar = async () => {
    if (
      !confirm(
        '¿Está seguro de que desea eliminar la firma electrónica configurada? Los nuevos documentos ya no se firmarán criptográficamente hasta subir un nuevo certificado.',
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/firma-electronica/config`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        },
      );
      if (!res.ok) throw new Error('Error al eliminar firma');
      toast.info('Firma electrónica eliminada.');
      fetchStatus();
    } catch (err: any) {
      toast.error(err.message || 'Error eliminando firma');
    }
  };

  return (
    <div className="p-6 mx-auto space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
            Configuración de Firma Electrónica (FirmaEC)
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Certificación digital criptográfica PKCS#12 (.p12 / .pfx) para actas de recepción y entrega en Hospital del Computador.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Estado
        </button>
      </div>

      {/* Tarjeta de Estado Actual */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <KeyIcon className="w-4 h-4 text-blue-600" />
            Estado del Certificado Digital
          </h2>
          {status?.configurado ? (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span>Firma Automática:</span>
                <input
                  type="checkbox"
                  checked={status.activo}
                  onChange={(e) => handleToggleActivo(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
              </label>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${status.activo
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${status.activo ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                    }`}
                />
                {status.activo ? 'Activa y Válida' : 'Inactiva'}
              </span>
            </div>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              No Configurada
            </span>
          )}
        </div>

        {status?.configurado ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-blue-50/50 dark:bg-blue-950/20 p-5 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Titular del Certificado</p>
                <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                  {status.titularNombre}
                </p>
                {status.titularCedulaRuc && (
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-0.5">
                    ID/RUC: {status.titularCedulaRuc}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Entidad Certificadora</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                  {status.entidadEmisora}
                </p>
                <p className="text-xs text-gray-500">Validador: FirmaEC / ARCOTEL</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Vigencia y Expiración</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                  {status.fechaExpiracion
                    ? new Date(status.fechaExpiracion).toLocaleDateString('es-EC', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                    : 'Sin fecha'}
                </p>
                <p
                  className={`text-xs font-bold mt-0.5 ${status.diasRestantes && status.diasRestantes > 30
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                    }`}
                >
                  {status.diasRestantes && status.diasRestantes > 0
                    ? `${status.diasRestantes} días restantes`
                    : 'Certificado expirado'}
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestFirma}
                  disabled={testing}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  <DocumentCheckIcon className="w-4 h-4" />
                  {testing ? 'Firmando y Verificando...' : 'Probar Firma Digital (Test en Vivo)'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleEliminar}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
              >
                <TrashIcon className="w-4 h-4" />
                Eliminar Firma Actual
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <div className="inline-flex p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-2xl">
              <ExclamationTriangleIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
              Ninguna firma electrónica registrada
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Para que cada comprobante de recepción y acta de entrega se firme criptográficamente con el certificado del Gerente (PAdES / FirmaEC), sube tu archivo .p12 a continuación.
            </p>
          </div>
        )}
      </div>

      {/* Formulario para Subir o Reemplazar Certificado .p12 */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-5">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowUpTrayIcon className="w-5 h-5 text-blue-600" />
            {status?.configurado ? 'Actualizar o Reemplazar Firma Electrónica' : 'Subir Certificado de Firma Electrónica (.p12)'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Formatos soportados: PKCS#12 (.p12 o .pfx) emitido por Banco Central del Ecuador, Security Data, Consejo de la Judicatura, ANF o Uanataca.
          </p>
        </div>

        <form onSubmit={handleSubirFirma} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo Archivo .p12 */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Archivo de Firma (.p12 / .pfx):
              </label>
              <input
                type="file"
                accept=".p12,.pfx"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/40 dark:file:text-blue-300 border border-gray-300 dark:border-gray-700 rounded-xl p-1.5 cursor-pointer bg-gray-50 dark:bg-gray-800"
              />
              {archivo && (
                <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  {archivo.name} ({Math.round(archivo.size / 1024)} KB)
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Contraseña del Certificado:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese la clave de su firma electrónica..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <InformationCircleIcon className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Seguridad Criptográfica Garantizada:</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                El archivo y su contraseña se cifran con estándar militar <strong>AES-256-GCM</strong> en el servidor. La clave nunca se comparte ni se expone en el frontend, y se utiliza exclusivamente para sellar los comprobantes PDF en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Validando Certificado con FirmaEC...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4" />
                  Validar y Guardar Firma Electrónica
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Información Legal sobre FirmaEC */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-2 text-xs text-gray-600 dark:text-gray-400">
        <h4 className="font-bold text-gray-900 dark:text-white uppercase flex items-center gap-1.5">
          <InformationCircleIcon className="w-4 h-4 text-blue-600" />
          Marco Legal en Ecuador (Ley de Comercio Electrónico):
        </h4>
        <p className="leading-relaxed">
          Los documentos firmados digitalmente mediante este módulo cumplen con los Artículos 14 y 15 de la <em>Ley de Comercio Electrónico, Firmas y Mensajes de Datos</em> de la República del Ecuador, otorgándoles la misma validez jurídica y probatoria que una firma manuscrita con reconocimiento ante notario público. Al abrir los comprobantes PDF en <strong>Adobe Acrobat Reader</strong> o en la aplicación estatal <strong>FirmaEC</strong>, el documento reflejará la verificación de integridad y el certificado válido del firmante.
        </p>
      </div>
    </div>
  );
}
