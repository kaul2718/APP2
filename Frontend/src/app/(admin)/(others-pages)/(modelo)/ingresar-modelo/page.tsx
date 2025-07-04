import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarModeloForm from "@/components/form/ingresar-modelo/IngresarModeloForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Modelo",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Modelo" />
            <IngresarModeloForm />
        </div>
    );
}
