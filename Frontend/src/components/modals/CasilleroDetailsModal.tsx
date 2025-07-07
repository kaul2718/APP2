"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Casillero } from "@/hooks/useCasillero";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  casillero: Casillero | null;
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

export default function CasilleroDetailsModal({ isOpen, onClose, casillero }: Props) {
  if (!casillero) return null;

  const estaActivo = casillero.estado;
  const estaOcupado = casillero.situacion === 'Ocupado';
  const fechaCreacion = new Date(casillero.createdAt).toLocaleDateString();
  const fechaActualizacion = new Date(casillero.updatedAt).toLocaleDateString();
  const fechaEliminacion = casillero.deletedAt 
    ? new Date(casillero.deletedAt).toLocaleDateString() 
    : "No eliminado";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Casillero"
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
              value={casillero.id}
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
                      d="M7 21h10a2 2 0 002-2V9a2 2 0 00-2-2h-2.93M12 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-5"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Código"
              value={casillero.codigo}
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
              label="Descripción"
              value={casillero.descripcion}
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
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Orden Asignada"
              value={casillero.order?.workOrderNumber || "Ninguna"}
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
          </div>
        </section>

        {/* Estado y situación */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Estado y Situación
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="Situación"
              value={estaOcupado ? "Ocupado" : "Disponible"}
              icon={
                <Icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {estaOcupado ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    )}
                  </svg>
                </Icon>
              }
            />
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
          </div>
        </section>

        {/* Fechas */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Fechas
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
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