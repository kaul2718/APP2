import React from 'react';
import { Metadata } from 'next';
import ClientComponent from '../ClientComponent';

export const metadata: Metadata = {
  title: 'Reporte de Presupuestos | Hospital del Computador',
  description: 'Bitácora financiera de presupuestos emitidos y sus tasas de conversión',
};

export default function Page() {
  return <ClientComponent initialTab="budgets" standalone={true} />;
}
