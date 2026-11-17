import React from 'react';
import { Metadata } from 'next';
import AuditoriaInternaClient from './AuditoriaInternaClient';

export const metadata: Metadata = {
  title: 'Auditoría Interna | Actividad del Sistema | Hospital del Computador',
  description: 'Registro inmutable de operaciones críticas y eventos de seguridad del sistema.',
};

export default function AuditoriaInternaPage() {
  return <AuditoriaInternaClient />;
}

