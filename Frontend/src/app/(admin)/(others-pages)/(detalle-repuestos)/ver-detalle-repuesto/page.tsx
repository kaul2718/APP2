import React from "react";
import { Metadata } from "next";
import DetalleRepuestoComponent from "./DetalleRepuestosComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización detalle repuestos",
};

export default function Page() {
  return <DetalleRepuestoComponent />;
}
