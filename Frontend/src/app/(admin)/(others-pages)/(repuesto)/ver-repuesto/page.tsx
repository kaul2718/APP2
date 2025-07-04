
import React from "react";
import { Metadata } from "next";
import RepuestoComponent from "./RepuestoComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de repuestos",
};

export default function Page() {
  return <RepuestoComponent />;
}
