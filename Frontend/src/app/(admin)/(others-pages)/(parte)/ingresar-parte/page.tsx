import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarParteForm from "@/components/form/ingresar-parte/IngresarParteForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Parte",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Parte" />
            <IngresarParteForm />
        </div>
    );
}
