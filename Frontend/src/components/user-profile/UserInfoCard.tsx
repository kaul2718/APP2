"use client";
import React from "react";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function UserInfoCard() {
  const { usuario, editando, cargando, error } = useUserProfile(); // Añadimos editando

  if (cargando && !usuario) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 text-center">
        Cargando información...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 text-center text-red-500">
        Error al cargar datos: {error}
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 text-center">
        No se encontraron datos de usuario
      </div>
    );
  }

  // Usamos editando como fuente de verdad si existe, sino usuario
  const datosMostrados = editando || usuario;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Información Personal
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Nombre completo
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {datosMostrados.nombre}  {datosMostrados.apellido}

              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Correo electrónico
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {datosMostrados.correo}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Teléfono
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {datosMostrados.telefono || "-"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Cédula
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {datosMostrados.cedula || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}