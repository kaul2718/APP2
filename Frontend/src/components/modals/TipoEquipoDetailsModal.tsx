"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { TipoEquipo } from "@/hooks/useTipoEquipo";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tipoEquipo: TipoEquipo | null;
}

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex w-5 h-5 mr-2 text-gray-400 dark:text-gray-500">{children}</span>
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
      value={value !== undefined && value !== null ? value.toString() : "No disponible"}
      className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      tabIndex={-1}
    />
  </div>
);

export default function TipoEquipoDetailsModal({ isOpen, onClose, tipoEquipo }: Props) {
  if (!tipoEquipo) return null;

  // Cambié la lógica para usar el campo 'estado' booleano
  const estaActivo = tipoEquipo.estado;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Tipo de Equipo"
      className="max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
    >
      <div className="px-6 py-4 space-y-8 text-sm">
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Información Básica</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="ID"
              value={tipoEquipo.id}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              label="Nombre"
              value={tipoEquipo.nombre}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.705 6.879 1.904M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </Icon>
              }
            />
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Estado</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4">
            <InputDisplay
              label="Estado"
              value={estaActivo ? "Activo" : "Inactivo"}
              icon={
                <Icon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={estaActivo ? "M9 12l2 2 4-4" : "M6 18L18 6M6 6l12 12"}
                    />
                  </svg>
                </Icon>
              }
            />
          </div>
        </section>

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
