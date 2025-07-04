// src/app/(admin)/(others-pages)/(usuarios)/ver-usuario/page.tsx
import React from "react";
import { Metadata } from "next";
import EspecificacionParteComponent from "./EspecificacionParteComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de especificación parte",
};

export default function Page() {
  return <EspecificacionParteComponent />;
}
