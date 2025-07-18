import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarTipoActividadTecnicaForm from "@/components/form/ingresar-tipo-actividad-tecnica/IngresarTipoActividadTecnicaForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Tipo Actividad Técnica",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Tipo Actividad Técnica" />
            <IngresarTipoActividadTecnicaForm />
        </div>
    );
}
