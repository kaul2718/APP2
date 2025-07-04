import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarCategoriaForm from "@/components/form/ingresar-categoria/IngresarCategoriaForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Categoria",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Categoria" />
            <IngresarCategoriaForm />
        </div>
    );
}
