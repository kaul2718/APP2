"use client";
import React from "react";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function UserAddressCard() {
  const { usuario, cargando, error } = useUserProfile();

  if (cargando) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">Cargando dirección...</p>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 text-center">
        <p className="text-red-500 dark:text-red-400">Error al cargar la dirección</p>
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Dirección
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            {/* Si tienes campo country en backend, úsalo, si no, puedes dejar un valor fijo o eliminar */}
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                País
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {usuario.country || "Ecuador"} {/* Ajusta si tienes ese campo */}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Ciudad / Estado
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {usuario.ciudad || "No definida"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Dirección
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {usuario.direccion || "No definida"}
              </p>
            </div>     
          </div>
        </div>
      </div>
    </div>
  );
}
