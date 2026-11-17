import React from 'react';
import { Metadata } from 'next';
import ComportamientoClientesClient from './ComportamientoClientesClient';

export const metadata: Metadata = {
  title: 'Comportamiento de Clientes | Actividad del Sistema | Hospital del Computador',
  description: 'Métricas agregadas de uso del portal público y privado de clientes.',
};

export default function ComportamientoClientesPage() {
  return <ComportamientoClientesClient />;
}

