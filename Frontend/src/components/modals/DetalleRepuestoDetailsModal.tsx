"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { DetalleRepuesto } from "@/hooks/useDetalleRepuesto";
import { CurrencyDollarIcon, TagIcon, HashtagIcon, CalendarIcon, ClockIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  detalle: DetalleRepuesto | null;
}

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex w-5 h-5 mr-2 text-gray-400 dark:text-gray-500">
    {children}
  </span>
);

const InputDisplay = ({
  label,
  icon,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  value?: string | number | boolean | null;
}) => (
  <div>
    <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
      {icon}
      {label}
    </label>
    <input
      type="text"
      readOnly
      value={
        value !== undefined && value !== null ? value.toString() : "No disponible"
      }
      className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      tabIndex={-1}
    />
  </div>
);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(value);
};

export default function DetalleRepuestoDetailsModal({ isOpen, onClose, detalle }: Props) {
  if (!detalle) return null;

  const estaActivo = detalle.estado && !detalle.deletedAt;
  const fechaCreacion = new Date(detalle.createdAt).toLocaleDateString();
  const fechaActualizacion = new Date(detalle.updatedAt).toLocaleDateString();
  const fechaEliminacion = detalle.deletedAt
    ? new Date(detalle.deletedAt).toLocaleDateString()
    : "No eliminado";
  const fechaUso = detalle.fechaUso
    ? new Date(detalle.fechaUso).toLocaleDateString()
    : "No especificada";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles de Repuesto"
      className="max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
    >
      <div className="px-6 py-4 space-y-8 text-sm">
        {/* Sección básica */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Información Básica
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="ID"
              value={detalle.id}
              icon={
                <Icon>
                  <HashtagIcon className="w-5 h-5" />
                </Icon>
              }
            />
            <InputDisplay
              label="Presupuesto ID"
              value={detalle.presupuestoId}
              icon={
                <Icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Repuesto"
              value={detalle.repuesto?.nombre || "No disponible"}
              icon={
                <Icon>
                  <TagIcon className="w-5 h-5" />
                </Icon>
              }
            />
            <InputDisplay
              label="Código del Repuesto"
              value={detalle.repuesto?.codigo || "No disponible"}
              icon={
                <Icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Cantidad"
              value={detalle.cantidad}
              icon={
                <Icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Precio Unitario"
              value={formatCurrency(detalle.precioUnitario)}
              icon={
                <Icon>
                  <CurrencyDollarIcon className="w-5 h-5" />
                </Icon>
              }
            />
            <InputDisplay
              label="Subtotal"
              value={formatCurrency(detalle.subtotal)}
              icon={
                <Icon>
                  <CurrencyDollarIcon className="w-5 h-5" />
                </Icon>
              }
            />
            <InputDisplay
              label="Fecha de Uso"
              value={fechaUso}
              icon={
                <Icon>
                  <CalendarIcon className="w-5 h-5" />
                </Icon>
              }
            />
            {detalle.comentario && (
              <InputDisplay
                label="Comentario"
                value={detalle.comentario}
                icon={
                  <Icon>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </Icon>
                }
              />
            )}
          </div>
        </section>

        {/* Estado */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Estado y Fechas
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="Estado"
              value={estaActivo ? "Activo" : detalle.deletedAt ? "Eliminado" : "Inactivo"}
              icon={
                <Icon>
                  {estaActivo ? (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  ) : detalle.deletedAt ? (
                    <TrashIcon className="w-5 h-5 text-red-500" />
                  ) : (
                    <XMarkIcon className="w-5 h-5 text-yellow-500" />
                  )}
                </Icon>
              }
            />
            <InputDisplay
              label="Fecha de Creación"
              value={fechaCreacion}
              icon={
                <Icon>
                  <CalendarIcon className="w-5 h-5" />
                </Icon>
              }
            />
            <InputDisplay
              label="Última Actualización"
              value={fechaActualizacion}
              icon={
                <Icon>
                  <ClockIcon className="w-5 h-5" />
                </Icon>
              }
            />
            {detalle.deletedAt && (
              <InputDisplay
                label="Fecha de Eliminación"
                value={fechaEliminacion}
                icon={
                  <Icon>
                    <TrashIcon className="w-5 h-5" />
                  </Icon>
                }
              />
            )}
          </div>
        </section>

        {/* Cerrar */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="w-full max-w-xs rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}