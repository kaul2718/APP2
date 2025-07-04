// src/app/(admin)/(others-pages)/(usuarios)/ver-usuario/page.tsx
import React from "react";
import { Metadata } from "next";
import TipoEspecificacionComponent from "./TipoEspecificacionComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de tipo de especificación",
};

export default function Page() {
  return <TipoEspecificacionComponent />;
}
