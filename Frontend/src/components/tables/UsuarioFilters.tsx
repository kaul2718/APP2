'use client';
import React from 'react';

interface Props {
  search: string;
  setSearch: (value: string) => void;
  role: string;
  setRole: (value: string) => void;
  estado: string;
  setEstado: (value: string) => void;
}

export default function UsuarioFilters({ search, setSearch, role, setRole, estado, setEstado }: Props) {
  return (
    <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 w-full">
        <input
          type="text"
          placeholder="Buscar por nombre, cédula o correo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-2 sm:mt-0 w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          <option value="">Todos los roles</option>
          <option value="Administrador">Administrador</option>
          <option value="Técnico">Técnico</option>
          <option value="Recepcionista">Recepcionista</option>
          <option value="Cliente">Cliente</option>
        </select>

        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="mt-2 sm:mt-0 w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="deshabilitado">Deshabilitado</option>
        </select>
      </div>
    </div>
  );
}
