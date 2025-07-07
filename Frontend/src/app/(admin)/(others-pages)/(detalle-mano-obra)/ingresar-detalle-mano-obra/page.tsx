
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarDetalleManoObraForm from "@/components/form/ingresar-detalle-mano-obra/IngresarDetalleManoObraForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Detalle Mano Obra",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Detalle Mano Obra" />
            <IngresarDetalleManoObraForm />
        </div>
    );
}
