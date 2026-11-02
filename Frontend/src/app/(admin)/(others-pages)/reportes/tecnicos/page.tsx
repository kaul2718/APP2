import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ClientComponent from '../ClientComponent';

export const metadata: Metadata = {
  title: 'Productividad y Carga de Trabajo por Técnico | Hospital del Computador',
  description: 'Auditoría de órdenes en proceso, finalizadas e intervenciones técnicas registradas',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Cargando reporte de técnicos...</div>}>
      <ClientComponent initialTab="techs" />
    </Suspense>
  );
}
