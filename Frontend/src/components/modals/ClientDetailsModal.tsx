"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Cliente } from "@/hooks/useClientes";
import Badge from "../ui/badge/Badge";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
}

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex w-5 h-5 mr-2 text-gray-400 dark:text-gray-500">{children}</span>
);

const InputDisplay = ({
  label,
  icon,
  value,
  badge,
}: {
  label: string;
  icon: React.ReactNode;
  value?: string | null;
  badge?: boolean;
}) => (
  <div>
    <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
      {icon}
      {label}
    </label>
    {badge ? (
      <div className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
        {value}
      </div>
    ) : (
      <input
        type="text"
        readOnly
        value={value ?? "No disponible"}
        className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
        tabIndex={-1}
      />
    )}
  </div>
);

export default function ClientDetailsModal({ isOpen, onClose, cliente }: Props) {
  if (!cliente) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Cliente"
      className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
    >
      <div className="px-6 py-4 space-y-8 text-sm">
        {/* Información Personal */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Información Personal</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="Nombre"
              value={cliente.nombre}
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
                      d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.705 6.879 1.904M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Cédula"
              value={cliente.cedula}
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
                      d="M8 7V3m8 4V3M3 11h18M4 19h16a2 2 0 002-2v-3H2v3a2 2 0 002 2z"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Teléfono"
              value={cliente.telefono}
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
                      d="M3 5h2l3.5 7-1.2 1.2A11.04 11.04 0 0112 17a11.04 11.04 0 015.3-3.6l1.2-1.2L19 5h2"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Correo"
              value={cliente.correo}
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
                      d="M16 12h2a2 2 0 002-2v-2M8 12H6a2 2 0 00-2 2v2M7 16h10"
                    />
                  </svg>
                </Icon>
              }
            />
          </div>
        </section>

        {/* Dirección */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Dirección</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="Ciudad"
              value={cliente.ciudad}
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
                      d="M12 8c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zM4 20h16v-2H4v2z"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Dirección"
              value={cliente.direccion}
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
                      d="M3 10h18v6H3v-6z"
                    />
                  </svg>
                </Icon>
              }
            />
          </div>
        </section>

        {/* Rol y Estado */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Rol y Estado</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
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
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.042 12.042 0 01.84 6.178M12 14v7" />
                  </svg>
                </Icon>
                Rol
              </label>
              <div className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                <Badge size="sm" color={cliente.role === 'ADMIN' ? 'primary' : 'secondary'}>
                  {cliente.role}
                </Badge>
              </div>
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <Icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                </Icon>
                Estado
              </label>
              <div className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                <Badge size="sm" color={cliente.estado ? "success" : "error"}>
                  {cliente.estado ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Botón para cerrar */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="w-full max-w-xs rounded-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            aria-label="Cerrar modal"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}