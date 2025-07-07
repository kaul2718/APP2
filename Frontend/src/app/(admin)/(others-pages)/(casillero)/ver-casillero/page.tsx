// src/app/(admin)/(others-pages)/(usuarios)/ver-usuario/page.tsx
import React from "react";
import { Metadata } from "next";
import CasilleroComponent from "./CasilleroComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de casilleros",
};

export default function Page() {
  return <CasilleroComponent />;
}
