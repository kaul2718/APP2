import React from "react";
import { Metadata } from "next";
import ClientComponent from "./ClientComponent";

export const metadata: Metadata = {
  title: "Roles y Permisos | Hospital del Computador",
  description: "Administración de roles de usuario y permisos del sistema",
};

export default function Page() {
  return <ClientComponent />;
}
