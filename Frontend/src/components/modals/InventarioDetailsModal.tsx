"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Inventario } from "@/hooks/useInventario";
import { CubeIcon, MapPinIcon, HashtagIcon, ExclamationCircleIcon, CalendarIcon, ClockIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventario: Inventario | null;
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
  warning = false
}: {
  label: string;
  icon: React.ReactNode;
  value?: string | number | boolean | null;
  warning?: boolean;
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
      className={`w-full rounded-md border px-3 py-2 ${
        warning 
          ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          : "border-gray-300 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
      }`}
      tabIndex={-1}
    />
  </div>
);

export default function InventarioDetailsModal({ isOpen, onClose, inventario }: Props) {
  if (!inventario) return null;

  const estaActivo = inventario.estado;
  const bajoStock = inventario.cantidad < inventario.stockMinimo;
  const fechaCreacion = new Date(inventario.createdAt).toLocaleDateString();
  const fechaActualizacion = new Date(inventario.updatedAt).toLocaleDateString();
  const fechaEliminacion = inventario.deletedAt 
    ? new Date(inventario.deletedAt).toLocaleDateString() 
    : "No eliminado";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Inventario"
      className="max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
    >
      <div className="px-6 py-4 space-y-8 text-sm">
        {/* Sección básica */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Información del Producto
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="ID"
              value={inventario.id}
              icon={
                <Icon>
                  <HashtagIcon className="w-5 h-5" />
                </Icon>
              }
            />
            <InputDisplay
              label="Parte/Repuesto"
              value={inventario.parte?.nombre || "Sin parte"}
              icon={
                <Icon>
                  <CubeIcon className="w-5 h-5" />
                </Icon>
              }
            />
            <InputDisplay
              label="Modelo"
              value={inventario.parte?.modelo || "No especificado"}
              icon={
                <Icon>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </Icon>
              }
            />
            <InputDisplay
              label="Ubicación"
              value={inventario.ubicacion}
              icon={
                <Icon>
                  <MapPinIcon className="w-5 h-5" />
                </Icon>
              }
            />
          </div>
        </section>

        {/* Stock */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Gestión de Stock
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="Cantidad Disponible"
              value={inventario.cantidad}
              warning={bajoStock}
              icon={
                <Icon>
                  <div className="relative">
                    <HashtagIcon className="w-5 h-5" />
                    {bajoStock && (
                      <ExclamationCircleIcon className="absolute -top-1 -right-1 w-3 h-3 text-red-500" />
                    )}
                  </div>
                </Icon>
              }
            />
            <InputDisplay
              label="Stock Mínimo"
              value={inventario.stockMinimo}
              icon={
                <Icon>
                  <ExclamationCircleIcon className="w-5 h-5" />
                </Icon>
              }
            />
            <InputDisplay
              label="Estado Stock"
              value={bajoStock ? "BAJO STOCK" : "DISPONIBLE"}
              warning={bajoStock}
              icon={
                <Icon>
                  {bajoStock ? (
                    <XMarkIcon className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  )}
                </Icon>
              }
            />
          </div>
        </section>

        {/* Estado y fechas */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Historial y Estado
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="Estado"
              value={estaActivo ? "Activo" : "Inactivo"}
              icon={
                <Icon>
                  {estaActivo ? (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XMarkIcon className="w-5 h-5 text-red-500" />
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
            <InputDisplay
              label="Fecha de Eliminación"
              value={fechaEliminacion}
              icon={
                <Icon>
                  <TrashIcon className="w-5 h-5" />
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