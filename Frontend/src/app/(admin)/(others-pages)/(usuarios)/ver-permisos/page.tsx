import React from "react";
import { Metadata } from "next";
import ClientComponent from "./ClientComponent";

export const metadata: Metadata = {
  title: "Catálogo de Permisos | Hospital del Computador",
  description: "Administración global de permisos y acciones del sistema",
};

export default function Page() {
  return <ClientComponent />;
}
