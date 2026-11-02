import React, { Suspense } from "react";
import { Metadata } from "next";
import AlmacenComponent from "./AlmacenComponent";

export const metadata: Metadata = {
  title: "Almacén Pro | Hospital del Computador",
  description: "Gestión centralizada de inventario, precios y costos profesionales.",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Cargando almacén...</div>}>
      <AlmacenComponent />
    </Suspense>
  );
}
