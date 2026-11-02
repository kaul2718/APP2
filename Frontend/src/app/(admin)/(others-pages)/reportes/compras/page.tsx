import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ClientComponent from '../ClientComponent';

export const metadata: Metadata = {
  title: 'Reporte de Compras y Proveedores | Hospital del Computador',
  description: 'Auditoría financiera de facturación y compras a proveedores',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Cargando reporte de compras...</div>}>
      <ClientComponent initialTab="purchases" />
    </Suspense>
  );
}
