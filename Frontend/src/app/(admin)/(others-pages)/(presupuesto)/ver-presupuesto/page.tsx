import React from "react";
import { Metadata } from "next";
import PresupuestoComponent from "./PresupuestoComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de presupuestos",
};

export default function Page() {
  return <PresupuestoComponent />;
}
