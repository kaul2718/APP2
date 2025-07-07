// src/app/(admin)/(others-pages)/(usuarios)/ver-usuario/page.tsx
import React from "react";
import { Metadata } from "next";
import ActividadTecnicaComponent from "./ActividadTecnicaComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de Actividades Técnicas",
};

export default function Page() {
  return <ActividadTecnicaComponent />;
}
