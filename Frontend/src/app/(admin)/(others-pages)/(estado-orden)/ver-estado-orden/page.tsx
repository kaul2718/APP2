import React from "react";
import { Metadata } from "next";
import EstadoOrdenComponent from "./EstadoOrdenComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de estado orden",
};

export default function Page() {
  return <EstadoOrdenComponent />;
}
