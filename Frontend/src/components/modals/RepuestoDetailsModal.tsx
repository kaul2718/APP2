"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Repuesto } from "@/hooks/useRepuesto";
import { CurrencyDollarIcon, TagIcon, CogIcon, DocumentTextIcon, CubeIcon } from "@heroicons/react/24/outline";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  repuesto: Repuesto | null;
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

export default function RepuestoDetailsModal({ isOpen, onClose, repuesto }: Props) {
  if (!repuesto) return null;

  const estaActivo = repuesto.estado;
  const fechaCreacion = new Date(repuesto.createdAt).toLocaleDateString();
  const fechaActualizacion = new Date(repuesto.updatedAt).toLocaleDateString();
  const fechaEliminacion = repuesto.deletedAt 
    ? new Date(repuesto.deletedAt).toLocaleDateString() 
    : "No eliminado";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Repuesto"
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
              value={repuesto.id}
              icon={
                <Icon>
                  <TagIcon className="w-5 h-5" />
                </Icon>
              }
            />
            <InputDisplay
              label="Código"
              value={repuesto.codigo}
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
              label="Nombre"
              value={repuesto.nombre}
              icon={
                <Icon>
                  <CogIcon className="w-5 h-5" />
                </Icon>
              }
            />
            <InputDisplay
              label="Parte"
              value={repuesto.parte?.nombre || "Sin parte"}
              icon={
                <Icon>
                  <CubeIcon className="w-5 h-5" />
                </Icon>
              }
            />
            <InputDisplay
              label="Precio de Venta"
              value={repuesto.precioVenta.toLocaleString('es-CL', {
                style: 'currency',
                currency: 'CLP'
              })}
              icon={
                <Icon>
                  <CurrencyDollarIcon className="w-5 h-5" />
                </Icon>
              }
            />
          </div>
        </section>

        {/* Descripción */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Descripción
          </h3>
          <div className="relative">
            <textarea
              readOnly
              value={repuesto.descripcion || "No disponible"}
              className="w-full pl-10 p-2 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 dark:border-gray-600 min-h-[100px]"
              tabIndex={-1}
            />
            <DocumentTextIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-3" />
          </div>
        </section>

        {/* Estado */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Estado
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="Estado"
              value={estaActivo ? "Activo" : "Inactivo"}
              icon={
                <Icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={
                        estaActivo
                          ? "M9 12l2 2 4-4"
                          : "M6 18L18 6M6 6l12 12"
                      }
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Fecha de Creación"
              value={fechaCreacion}
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Última Actualización"
              value={fechaActualizacion}
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Fecha de Eliminación"
              value={fechaEliminacion}
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </Icon>
              }
            />
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