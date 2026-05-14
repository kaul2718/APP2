"use client";

import React from "react";
import CrudModal from "@/components/modals/CrudModal";
import type { Order } from "@/types/order.types";
import { formatDate, formatUserName } from "@/lib/formatters";

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
  if (!order) return null;

  const accesorios = order.accesorios?.filter(Boolean) ?? [];
  const historialReciente = order.historialEstados?.slice(0, 3) ?? [];

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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoItem label="Numero de orden" value={order.workOrderNumber} />
            <InfoItem label="Estado de orden" value={order.estadoOrden?.nombre || "Sin estado"} />
            <InfoItem label="Fecha prometida" value={formatDate(order.fechaPrometidaEntrega)} />
            <InfoItem label="Tecnico" value={formatUserName(order.technician)} />
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
