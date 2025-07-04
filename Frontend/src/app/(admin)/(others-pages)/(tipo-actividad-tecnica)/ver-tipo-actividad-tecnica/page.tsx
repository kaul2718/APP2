import React from "react";
import { Metadata } from "next";
import TipoActividadTecnicaComponent from "./TipoActividadTecnicaComponent";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Página para visualización de tipo de actividades técnicas",
};

export default function Page() {
    return <TipoActividadTecnicaComponent />;
}
