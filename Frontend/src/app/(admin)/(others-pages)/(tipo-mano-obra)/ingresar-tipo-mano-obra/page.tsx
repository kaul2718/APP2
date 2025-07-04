import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarTipoManoObraForm from "@/components/form/ingresar-tipo-mano-obra/IngresarTipoManoObraForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Tipo Mano de Obra",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Ingresar Tipo Mano de Obra" />
            <IngresarTipoManoObraForm />
        </div>
    );
}
