// src/app/(admin)/(others-pages)/(usuarios)/ver-usuario/page.tsx
import React from "react";
import { Metadata } from "next";
import TipoNotificacionComponent from "./TipoNotificacionComponent";

export const metadata: Metadata = {
  title: "Hospital del Computador",
  description: "Página para visualización de tipo de notificación",
};

export default function Page() {
  return <TipoNotificacionComponent />;
}
