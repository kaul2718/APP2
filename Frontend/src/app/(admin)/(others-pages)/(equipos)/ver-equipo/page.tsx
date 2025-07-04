import React from "react";
import { Metadata } from "next";
import EquipoComponent from "./EquipoComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de modelo",
};

export default function Page() {
  return <EquipoComponent />;
}
