import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarEspecificacionParteForm from "@/components/form/ingresar-especificacion-parte/IngresarEspecificacionParteForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Especificación Parte",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Especificación Parte" />
            <IngresarEspecificacionParteForm />
        </div>
    );
}
