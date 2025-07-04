import React from "react";
import { Metadata } from "next";
import TipoManoObraComponent from "./TipoManoObraComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de tipo mano de Obra",
};

export default function Page() {
  return <TipoManoObraComponent />;
}
