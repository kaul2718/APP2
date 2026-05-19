import React from 'react';
import { Metadata } from 'next';
import ClientComponent from '../ClientComponent';

export const metadata: Metadata = {
  title: 'Reporte de Órdenes de Servicio | Hospital del Computador',
  description: 'Auditoría de estados, asignaciones y cumplimiento de ODS',
};

export default function Page() {
  return <ClientComponent initialTab="orders" standalone={true} />;
}
