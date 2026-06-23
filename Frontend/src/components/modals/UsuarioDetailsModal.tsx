"use client";

import React from "react";
import CrudModal from "@/components/modals/CrudModal";
import { Usuario } from "@/hooks/useUsuario";
import { Role } from "@/types/role";
import {
  UserIcon,
  IdentificationIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  TrashIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
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
}) => {
  const inputId = React.useId();
  return (
    <div>
      <label htmlFor={inputId} className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center">
        {icon}
        {label}
      </label>
      <input
        type="text"
        id={inputId}
        readOnly
        value={
          value !== undefined && value !== null ? value.toString() : "No disponible"
        }
        className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
        tabIndex={-1}
      />
    </div>
  );
};

export default function UsuarioDetailsModal({ isOpen, onClose, usuario }: Props) {
  if (!usuario) return null;

  const formatRoleName = (role: Role): string => {
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  const estaActivo = usuario.estado;
  const fechaCreacion = new Date(usuario.createdAt).toLocaleDateString();
  const fechaActualizacion = new Date(usuario.updatedAt).toLocaleDateString();
  const fechaEliminacion = usuario.deletedAt 
    ? new Date(usuario.deletedAt).toLocaleDateString() 
    : "No eliminado";

  return (
    <CrudModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Usuario"
      onSubmit={async () => {}}
      mode="view"
      hideActions
    >
      <div className="px-6 py-4 space-y-8 text-sm">
        {/* Sección básica */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Información Personal
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="ID"
              value={usuario.id}
              icon={<Icon><DocumentIcon className="w-full h-full" /></Icon>}
            />
            <InputDisplay
              label="Nombre Completo"
              value={`${usuario.nombre} ${usuario.apellido}`}
              icon={<Icon><UserIcon className="w-full h-full" /></Icon>}
            />
            <InputDisplay
              label="Cédula"
              value={usuario.cedula}
              icon={<Icon><IdentificationIcon className="w-full h-full" /></Icon>}
            />
            <InputDisplay
              label="Correo Electrónico"
              value={usuario.correo}
              icon={<Icon><EnvelopeIcon className="w-full h-full" /></Icon>}
            />
            <InputDisplay
              label="Teléfono"
              value={usuario.telefono}
              icon={<Icon><PhoneIcon className="w-full h-full" /></Icon>}
            />
            <InputDisplay
              label="Rol"
              value={formatRoleName(usuario.role)}
              icon={<Icon><ShieldCheckIcon className="w-full h-full" /></Icon>}
            />
          </div>
        </section>

        {/* Información de ubicación */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Ubicación
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InputDisplay
              label="Dirección"
              value={usuario.direccion}
              icon={<Icon><MapPinIcon className="w-full h-full" /></Icon>}
            />
            <InputDisplay
              label="Ciudad"
              value={usuario.ciudad}
              icon={<Icon><BuildingOfficeIcon className="w-full h-full" /></Icon>}
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
              icon={<Icon><CheckCircleIcon className="w-full h-full" /></Icon>}
            />
            <InputDisplay
              label="Fecha de Creación"
              value={fechaCreacion}
              icon={<Icon><CalendarDaysIcon className="w-full h-full" /></Icon>}
            />
            <InputDisplay
              label="Última Actualización"
              value={fechaActualizacion}
              icon={<Icon><ClockIcon className="w-full h-full" /></Icon>}
            />
            <InputDisplay
              label="Fecha de Eliminación"
              value={fechaEliminacion}
              icon={<Icon><TrashIcon className="w-full h-full" /></Icon>}
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
    </CrudModal>
  );
}