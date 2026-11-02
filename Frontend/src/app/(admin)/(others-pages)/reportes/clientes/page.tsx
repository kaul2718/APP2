import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ClientComponent from '../ClientComponent';

export const metadata: Metadata = {
  title: 'Reporte de Clientes y Equipos Recurrentes | Hospital del Computador',
  description: 'Análisis detallado de frecuencia y visitas de clientes en las órdenes de servicio',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Cargando reporte de clientes...</div>}>
      <ClientComponent initialTab="clients" />
    </Suspense>
  );
}
