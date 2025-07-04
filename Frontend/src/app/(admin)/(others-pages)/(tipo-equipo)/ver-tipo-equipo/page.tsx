// src/app/(admin)/(others-pages)/(usuarios)/ver-usuario/page.tsx
import React from "react";
import { Metadata } from "next";
import TipoEquipoComponent from "./TipoEquipoComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de usuarios",
};

export default function Page() {
  return <TipoEquipoComponent />;
}
