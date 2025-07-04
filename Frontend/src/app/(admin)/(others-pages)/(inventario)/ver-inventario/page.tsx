// src/app/(admin)/(others-pages)/(usuarios)/ver-usuario/page.tsx
import React from "react";
import { Metadata } from "next";
import InventarioComponent from "./InventarioComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de inventario",
};

export default function Page() {
  return <InventarioComponent />;
}
