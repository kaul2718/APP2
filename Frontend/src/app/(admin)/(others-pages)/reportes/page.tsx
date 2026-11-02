import React, { Suspense } from "react";
import { Metadata } from "next";
import ClientComponent from "./ClientComponent";

export const metadata: Metadata = {
  title: "Reportes y Analíticas | Hospital del Computador",
  description: "Auditoría global de rendimiento técnico, presupuestos, inventario e ingresos",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Cargando módulo de reportes...</div>}>
      <ClientComponent />
    </Suspense>
  );
}
