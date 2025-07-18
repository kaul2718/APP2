import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarMarcaForm from "@/components/form/ingresar-marca/IngresarMarcaForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar marca",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Marca" />
            <IngresarMarcaForm />
        </div>
    );
}
