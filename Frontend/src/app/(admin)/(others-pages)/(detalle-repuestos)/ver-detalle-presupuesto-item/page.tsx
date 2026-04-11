import React from "react";
import { Metadata } from "next";
import DetallePresupuestoItemComponent from "./DetallePresupuestoItemComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de detalles de ítems",
};

export default function Page() {
  return <DetallePresupuestoItemComponent />;
}
