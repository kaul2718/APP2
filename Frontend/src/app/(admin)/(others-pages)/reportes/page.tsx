import React from "react";
import { Metadata } from "next";
import ClientComponent from "./ClientComponent";

export const metadata: Metadata = {
  title: "Reportes y Analíticas | Hospital del Computador",
  description: "Auditoría global de rendimiento técnico, presupuestos, inventario e ingresos",
};

export default function Page() {
  return <ClientComponent />;
}
