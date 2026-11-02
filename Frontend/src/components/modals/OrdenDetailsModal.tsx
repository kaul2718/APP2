"use client";

import React, { useState } from "react";
import CrudModal from "@/components/modals/CrudModal";
import type { Order } from "@/types/order.types";
import { formatDate, formatUserName } from "@/lib/formatters";
import ChecklistResultView from "@/components/orden/ChecklistResultView";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/60">
    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {title}
    </h3>
    {children}
  </section>
);

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/60">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value || "No disponible"}</p>
  </div>
);

export default function OrdenDetailsModal({ isOpen, onClose, order }: Props) {
  const { data: session } = useSession();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratedToken, setRegeneratedToken] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const accesorios = order.accesorios?.filter(Boolean) ?? [];
  const historialReciente = order.historialEstados?.slice(0, 3) ?? [];

  const handleRegenerarCredencial = async () => {
    if (!order) return;
    const confirmed = window.confirm(
      `¿Desea generar una nueva clave privada para la orden #${order.workOrderNumber}? La clave anterior será invalidada de inmediato.`
    );
    if (!confirmed) return;

    try {
      setIsRegenerating(true);
      const token = (session as any)?.accessToken || (session as any)?.token;
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${baseUrl}/orders/${order.id}/credencial/regenerar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Error al regenerar credencial");
      }

      const data = await res.json();
      const raw = data.rawSecret || data?.data?.tokenAccesoRaw;
      setRegeneratedToken(raw);
      setRevoked(false);
      toast.success("Nueva clave privada generada correctamente", { position: "top-center" });
    } catch (err: any) {
      toast.error(err.message || "No se pudo regenerar la credencial", { position: "top-center" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRevocarCredencial = async () => {
    if (!order) return;
    const confirmed = window.confirm(
      `¿Está seguro de revocar la credencial de la orden #${order.workOrderNumber}? El cliente no podrá autorizar ni consultar la orden con su comprobante hasta que se genere una nueva.`
    );
    if (!confirmed) return;

    try {
      setIsRevoking(true);
      const token = (session as any)?.accessToken || (session as any)?.token;
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${baseUrl}/orders/${order.id}/credencial/revocar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Error al revocar credencial");
      }

      setRevoked(true);
      setRegeneratedToken(null);
      toast.warning("Credencial privada revocada exitosamente", { position: "top-center" });
    } catch (err: any) {
      toast.error(err.message || "No se pudo revocar la credencial", { position: "top-center" });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCopyConsultaLink = () => {
    if (!order) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cedula = order.client?.cedula || "";
    let link = `${origin}/consulta?workorder=${encodeURIComponent(order.workOrderNumber)}&cedula=${encodeURIComponent(cedula)}`;
    if (regeneratedToken) {
      link += `&token=${encodeURIComponent(regeneratedToken)}`;
    }
    navigator.clipboard.writeText(link);
    toast.info("Enlace de consulta copiado al portapapeles", { position: "top-center" });
  };

  const handleCopyToken = () => {
    if (!regeneratedToken) return;
    navigator.clipboard.writeText(regeneratedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.info("Clave privada copiada", { position: "top-center" });
  };

  return (
    <CrudModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalles de Orden #${order.workOrderNumber}`}
      onSubmit={async () => {}}
      mode="view"
      hideActions
    >
      <div className="space-y-4 px-1 pb-1 text-sm">
        <Section title="Resumen">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <InfoItem label="Numero de orden" value={order.workOrderNumber} />
            <InfoItem label="Modalidad" value={order.tipoOrden === 'EXPRESS' ? '⚡ Express' : '📋 Completa'} />
            <InfoItem label="Estado de orden" value={order.estadoOrden?.nombre || "Sin estado"} />
            <InfoItem label="Fecha prometida" value={formatDate(order.fechaPrometidaEntrega)} />
            <InfoItem label="Tecnico" value={formatUserName(order.technician)} />
          </div>
        </Section>

        {/* SECCIÓN DE SEGURIDAD Y CONSULTA DEL CLIENTE */}
        <Section title="Comprobante y Consulta del Cliente">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Acceso Digital Mediante Comprobante
                </p>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                  El cliente consulta y autoriza mediante el código QR impreso en su comprobante físico. No requiere contraseñas complejas ni correos.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyConsultaLink}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  📋 Copiar Enlace
                </button>
                <button
                  type="button"
                  disabled={isRegenerating}
                  onClick={handleRegenerarCredencial}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                >
                  {isRegenerating ? "Generando..." : "🔄 Generar Nuevo Ticket"}
                </button>
                <button
                  type="button"
                  disabled={isRevoking || revoked}
                  onClick={handleRevocarCredencial}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 disabled:opacity-50"
                >
                  {isRevoking ? "Suspendiendo..." : revoked ? "⚪ Suspendido" : "⛔ Suspender Acceso"}
                </button>
              </div>
            </div>

            {regeneratedToken && (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Nueva Clave de Ticket Generada:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {copied ? "✓ ¡Copiado!" : "Copiar clave"}
                  </button>
                </div>
                <code className="mt-1 block font-mono text-base font-bold tracking-widest text-amber-900 select-all dark:text-amber-200">
                  {regeneratedToken}
                </code>
                <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
                  Esta clave se incluirá en el nuevo comprobante de recepción para el cliente.
                </p>
              </div>
            )}
          </div>
        </Section>

        <Section title="Personas y equipo">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="Cliente" value={formatUserName(order.client)} />
            <InfoItem
              label="Recepcionista"
              value={order.recepcionista ? `${order.recepcionista.nombre} ${order.recepcionista.apellido || ""}`.trim() : "No especificado"}
            />
            <InfoItem label="Numero de serie" value={order.equipo?.numeroSerie} />
            <InfoItem label="Tipo de equipo" value={order.equipo?.tipoEquipo?.nombre || "No especificado"} />
            <InfoItem label="Marca" value={order.equipo?.marca?.nombre || "No especificada"} />
            <InfoItem label="Modelo" value={order.equipo?.modelo?.nombre || "No especificado"} />
          </div>
        </Section>

        <Section title="Diagnostico inicial">
          <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-900/60">
            <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
              {order.problemaReportado || "No disponible"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Accesorios
            </p>
            {accesorios.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {accesorios.map((accesorio, index) => (
                  <span
                    key={`${accesorio}-${index}`}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                  >
                    {accesorio}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No se registraron accesorios.</p>
            )}
          </div>
        </Section>

        {order.checklistData && (
          <Section title="Inspección Inicial de Recepción">
            <ChecklistResultView data={order.checklistData} />
          </Section>
        )}

        {order.presupuesto && (
          <Section title="Presupuesto">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <InfoItem label="Estado" value={order.presupuesto.estado?.nombre || "Sin estado"} />
              <InfoItem label="Fecha de emision" value={formatDate(order.presupuesto.fechaEmision)} />
              <InfoItem label="Items" value={order.detallesPresupuestoItems?.length || 0} />
            </div>
            {order.presupuesto.descripcion && (
              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-900/60">
                <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                  {order.presupuesto.descripcion}
                </p>
              </div>
            )}
          </Section>
        )}

        {order.actividades && order.actividades.length > 0 && (
          <Section title="Actividades tecnicas">
            <div className="space-y-3">
              {order.actividades.map((actividad) => (
                <div
                  key={actividad.id}
                  className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{actividad.tipoActividad?.nombre || 'Actividad Técnica'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(actividad.fecha)}</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-gray-800 dark:text-gray-200">Diagnostico:</span> {actividad.diagnostico}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-gray-800 dark:text-gray-200">Trabajo realizado:</span> {actividad.trabajoRealizado}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {historialReciente.length > 0 && (
          <Section title="Historial reciente">
            <div className="space-y-3">
              {historialReciente.map((historial) => (
                <div key={historial.id} className="flex gap-3 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-900/60">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {historial.estadoOrden.nombre}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(historial.fechaCambio)} · {historial.usuario.nombre} {historial.usuario.apellido}
                    </p>
                    {historial.observaciones && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{historial.observaciones}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </CrudModal>
  );
}
