import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarTipoEspecificacionForm from "@/components/form/ingresar-tipo-especificacion/IngresarTipoEspecificacionForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Tipo Especificación",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Tipo Especificación" />
            <IngresarTipoEspecificacionForm />
        </div>
    );
}
