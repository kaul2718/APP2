import React from "react";
import { Metadata } from "next";
import AlmacenComponent from "./AlmacenComponent";

export const metadata: Metadata = {
  title: "Almacén Pro | Hospital del Computador",
  description: "Gestión centralizada de inventario, precios y costos profesionales.",
};

export default function Page() {
  return <AlmacenComponent />;
}
