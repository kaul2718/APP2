import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarActividadTecnicaForm from "@/components/form/ingresar-actividad-tecnica/IngresarActividadTecnicaForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Actividad técnica",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Actividad" />
            <IngresarActividadTecnicaForm />
        </div>
    );
}
