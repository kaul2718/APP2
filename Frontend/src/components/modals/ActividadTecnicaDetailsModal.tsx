"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { ActividadTecnica } from "@/hooks/useActividadTecnica";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  actividad: ActividadTecnica | null;
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

const TextAreaDisplay = ({
  label,
  icon,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  value?: string;
}) => (
  <div>
    <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
      {icon}
      {label}
    </label>
    <textarea
      readOnly
      value={value || "No disponible"}
      className="w-full h-32 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      tabIndex={-1}
    />
  </div>
);

export default function ActividadTecnicaDetailsModal({ isOpen, onClose, actividad }: Props) {
  if (!actividad) return null;

  const estaActivo = actividad.estado;
  const fechaCreacion = format(new Date(actividad.createdAt), 'PPPpp', { locale: es });
  const fechaActualizacion = format(new Date(actividad.updatedAt), 'PPPpp', { locale: es });
  const fechaEliminacion = actividad.deletedAt 
    ? format(new Date(actividad.deletedAt), 'PPPpp', { locale: es })
    : "No eliminado";
  const fechaActividad = format(new Date(actividad.fecha), 'PPPpp', { locale: es });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles de la Actividad Técnica"
      className="max-w-3xl p-6 max-h-[80vh] overflow-y-auto"
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
              value={actividad.id}
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
              label="Orden de Trabajo"
              value={`#${actividad.orden.workOrderNumber}`}
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
              label="Tipo de Actividad"
              value={actividad.tipoActividad.nombre}
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Fecha de Actividad"
              value={fechaActividad}
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
          </div>
        </section>

        {/* Diagnóstico y trabajo realizado */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Detalles Técnicos
          </h3>
          <div className="space-y-4">
            <TextAreaDisplay
              label="Diagnóstico"
              value={actividad.diagnostico}
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </Icon>
              }
            />
            <TextAreaDisplay
              label="Trabajo Realizado"
              value={actividad.trabajoRealizado}
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </Icon>
              }
            />
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
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