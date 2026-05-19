import React from 'react';
import { Metadata } from 'next';
import ClientComponent from '../ClientComponent';

export const metadata: Metadata = {
  title: 'Reporte de Compras y Proveedores | Hospital del Computador',
  description: 'Auditoría financiera de facturación y compras a proveedores',
};

export default function Page() {
  return <ClientComponent initialTab="purchases" standalone={true} />;
}
