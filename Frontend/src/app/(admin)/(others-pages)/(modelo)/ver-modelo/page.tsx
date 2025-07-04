// src/app/(admin)/(others-pages)/(usuarios)/ver-usuario/page.tsx
import React from "react";
import { Metadata } from "next";
import ModeloComponent from "./ModeloComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de modelo",
};

export default function Page() {
  return <ModeloComponent />;
}
