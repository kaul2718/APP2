// src/app/(admin)/(others-pages)/(usuarios)/ver-usuario/page.tsx
import React from "react";
import { Metadata } from "next";
import EstadoPresupuestoComponent from "./EstadoPresupuestoComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de estado de presupuesto",
};

export default function Page() {
  return <EstadoPresupuestoComponent />;
}
