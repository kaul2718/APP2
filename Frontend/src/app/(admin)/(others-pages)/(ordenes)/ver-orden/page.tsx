'use client';

import React, { Suspense, useState } from "react";
import OrdenComponent from "./OrdenComponent";
import ClientOrderComponent from "./ClientOrderComponent";
import { usePermissions } from "@/hooks/usePermissions";

export default function Page() {
  const { isOperationalStaff, isClient, loading } = usePermissions();
  const [vista, setVista] = useState<'taller' | 'personal'>('taller');

  if (loading) return null;

  const mostrarSelectorPersonal = isOperationalStaff && isClient;

  return (
    <Suspense fallback={<div className="p-6">Cargando órdenes...</div>}>
      {mostrarSelectorPersonal && (
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setVista('taller')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              vista === 'taller'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Gestión de Taller
          </button>
          <button
            type="button"
            onClick={() => setVista('personal')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              vista === 'personal'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Mis Órdenes Personales (Cliente)
          </button>
        </div>
      )}

      {!isOperationalStaff || (mostrarSelectorPersonal && vista === 'personal') ? (
        <ClientOrderComponent />
      ) : (
        <OrdenComponent />
      )}
    </Suspense>
  );
}
