import React from 'react';
import { Metadata } from 'next';
import ClientComponent from '../ClientComponent';

export const metadata: Metadata = {
  title: 'Reporte de Clientes | Hospital del Computador',
  description: 'Análisis detallado de frecuencia y visitas de clientes en las órdenes de servicio',
};

export default function Page() {
  return <ClientComponent initialTab="clients" standalone={true} />;
}
