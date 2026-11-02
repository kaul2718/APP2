import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ClientComponent from '../ClientComponent';

export const metadata: Metadata = {
  title: 'Reporte de Inventario | Hospital del Computador',
  description: 'Auditoría de stock, precios y estados críticos de repuestos y componentes',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Cargando reporte de inventario...</div>}>
      <ClientComponent initialTab="inventory" />
    </Suspense>
  );
}
