import React from 'react';
import { Metadata } from 'next';
import ClientComponent from '../ClientComponent';

export const metadata: Metadata = {
  title: 'Reporte de Volumen por Marca de Equipos | Hospital del Computador',
  description: 'Auditoría del total de ingresos agrupado por marca de equipos',
};

export default function Page() {
  return <ClientComponent initialTab="equip" standalone={true} />;
}
