import React from 'react';
import { Metadata } from 'next';
import ClientComponent from '../ClientComponent';

export const metadata: Metadata = {
  title: 'Rendimiento y Facturación de Técnicos | Hospital del Computador',
  description: 'Auditoría del dinero total generado por técnico y asignaciones de ODS',
};

export default function Page() {
  return <ClientComponent initialTab="techs" standalone={true} />;
}
