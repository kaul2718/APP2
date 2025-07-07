// src/app/(admin)/(others-pages)/(usuarios)/ver-usuario/page.tsx
import React from "react";
import { Metadata } from "next";
import OrdenComponent from "./OrdenComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de ordenes",
};

export default function Page() {
  return <OrdenComponent />;
}
