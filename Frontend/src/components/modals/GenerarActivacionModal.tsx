"use client";

import React, { useState, useEffect } from "react";
import CrudModal from "@/components/modals/CrudModal";
import Button from "@/components/ui/button/Button";
import { Usuario } from "@/hooks/useUsuario";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
  QrCodeIcon,
  ShieldCheckIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  PrinterIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
  modo?: "ACTIVACION" | "RECUPERACION_PRESENCIAL";
}

export default function GenerarActivacionModal({
  isOpen,
  onClose,
  usuario,
  modo = "ACTIVACION",
}: Props) {
  const { data: session } = useSession();
  const token = session?.accessToken || "";

  const [idVerificada, setIdVerificada] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [datosActivacion, setDatosActivacion] = useState<{
    qrDataUrl: string;
    qrUrl: string;
    expiresAt: string;
    tipo: string;
  } | null>(null);

  const [tiempoRestante, setTiempoRestante] = useState<number>(0);

  // Reiniciar estado cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      setIdVerificada(false);
      setDatosActivacion(null);
      setTiempoRestante(0);
    }
  }, [isOpen, usuario]);

  // Contador regresivo de 15 minutos
  useEffect(() => {
    if (!datosActivacion?.expiresAt) return;

    const actualizarTimer = () => {
      const expira = new Date(datosActivacion.expiresAt).getTime();
      const ahora = Date.now();
      const diffSeg = Math.max(0, Math.floor((expira - ahora) / 1000));
      setTiempoRestante(diffSeg);
    };

    actualizarTimer();
    const interval = setInterval(actualizarTimer, 1000);

    return () => clearInterval(interval);
  }, [datosActivacion]);

  if (!usuario) return null;

  const esRecuperacion = modo === "RECUPERACION_PRESENCIAL";
  const tituloModal = esRecuperacion
    ? "Restablecer Contraseña Presencial"
    : "Activar Cuenta de Cliente";

  const formatearTiempo = (seg: number) => {
    const minutos = Math.floor(seg / 60);
    const segundos = seg % 60;
    return `${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`;
  };

  const handleGenerarQR = async () => {
    if (!idVerificada) {
      toast.warn("Debes confirmar la verificación de identidad del cliente.");
      return;
    }

    setGenerando(true);

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api/v1";
      const res = await fetch(`${baseUrl}/auth/activacion/generar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          usuarioId: usuario.id,
          tipo: modo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al emitir el código de activación.");
      }

      setDatosActivacion({
        qrDataUrl: data.qrDataUrl,
        qrUrl: data.qrUrl,
        expiresAt: data.expiresAt,
        tipo: data.tipo,
      });

      toast.success(
        `Código QR de ${esRecuperacion ? "restablecimiento" : "activación"} emitido. Vigencia: 15 min.`
      );
    } catch (err: any) {
      toast.error(err.message || "No se pudo generar la credencial.");
    } finally {
      setGenerando(false);
    }
  };

  const handleCopiarEnlace = () => {
    if (!datosActivacion?.qrUrl) return;
    navigator.clipboard.writeText(datosActivacion.qrUrl);
    toast.info("Enlace de activación copiado al portapapeles.");
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <CrudModal
      isOpen={isOpen}
      onClose={onClose}
      title={tituloModal}
      onSubmit={async () => {}}
      mode="view"
      hideActions
    >
      <div className="px-6 py-5 space-y-6 text-sm">
        {/* Cabecera del cliente */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-150 dark:border-gray-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide">
              {esRecuperacion ? "Restablecimiento Asistido" : "Activación Opcional"}
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
              {usuario.nombre} {usuario.apellido}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              C.I. {usuario.cedula} {usuario.correo ? `• ${usuario.correo}` : "• Sin correo electrónico"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
            {esRecuperacion ? (
              <KeyIcon className="w-5 h-5" />
            ) : (
              <QrCodeIcon className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Paso 1: Verificación de identidad si aún no se genera el QR */}
        {!datosActivacion ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-200">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                <span>Protocolo de Seguridad Presencial</span>
              </div>
              <p>
                La creación de una cuenta y contraseña para clientes es <strong>estrictamente opcional</strong>. Ningún cliente necesita cuenta para dejar su equipo en taller.
              </p>
              <p>
                La cédula identifica el registro, pero no constituye por sí sola una prueba de identidad. El código QR solo puede emitirse tras verificar físicamente la cédula de identidad del cliente en el mostrador.
              </p>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer hover:border-brand-500 transition-colors">
              <input
                type="checkbox"
                checked={idVerificada}
                onChange={(e) => setIdVerificada(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium select-none">
                Confirmo que he verificado presencialmente la cédula de identidad física de{" "}
                <strong>{usuario.nombre} {usuario.apellido}</strong> (C.I. {usuario.cedula}) en este momento.
              </span>
            </label>

            <Button
              className="w-full py-3"
              size="sm"
              onClick={handleGenerarQR}
              disabled={!idVerificada || generando}
            >
              {generando
                ? "Generando credencial segura..."
                : esRecuperacion
                ? "Generar QR para restablecer contraseña"
                : "Generar acceso de activación (QR)"}
            </Button>
          </div>
        ) : (
          /* Paso 2: Mostrar el código QR generado */
          <div className="space-y-5 text-center">
            {/* Countdown timer */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
              <ClockIcon className="w-4 h-4" />
              <span>
                {tiempoRestante > 0
                  ? `Vigencia: ${formatearTiempo(tiempoRestante)}`
                  : "Credencial expirada"}
              </span>
            </div>

            {/* Contenedor del código QR */}
            <div className="p-4 bg-white rounded-3xl border-2 border-dashed border-brand-300 dark:border-brand-700 shadow-md inline-block mx-auto">
              <img
                src={datosActivacion.qrDataUrl}
                alt="Código QR de Activación"
                className="w-60 h-60 mx-auto rounded-xl object-contain"
              />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Pida al cliente que escanee el código con su teléfono
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Se abrirá directamente la pantalla segura para que el cliente ingrese su contraseña personal. Este código es de un solo uso y se invalidará automáticamente.
              </p>
            </div>

            {/* Botones de acción complementarios */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopiarEnlace}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
              >
                <ClipboardDocumentCheckIcon className="w-4 h-4 text-brand-500" />
                <span>Copiar enlace</span>
              </button>

              <button
                type="button"
                onClick={handleGenerarQR}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
              >
                <ClockIcon className="w-4 h-4 text-amber-500" />
                <span>Regenerar QR</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </CrudModal>
  );
}
