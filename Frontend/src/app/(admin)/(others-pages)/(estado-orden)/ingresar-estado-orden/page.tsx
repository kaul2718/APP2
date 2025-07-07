import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarEstadoOrdenForm from "@/components/form/ingresar-estado-orden/IngresarEstadoOrdenForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Estado Orden",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Estado Orden" />
            <IngresarEstadoOrdenForm />
        </div>
    );
}
