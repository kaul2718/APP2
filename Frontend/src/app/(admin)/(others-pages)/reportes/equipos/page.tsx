import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ClientComponent from '../ClientComponent';

export const metadata: Metadata = {
  title: 'Reporte de Equipos Recibidos vs. Físicamente Entregados | Hospital del Computador',
  description: 'Auditoría de equipos ingresados a taller vs. físicamente entregados a clientes y tiempos de permanencia',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Cargando reporte de equipos...</div>}>
      <ClientComponent initialTab="delivered" />
    </Suspense>
  );
}
