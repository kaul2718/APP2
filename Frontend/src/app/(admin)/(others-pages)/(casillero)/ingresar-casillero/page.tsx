import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarCasilleroForm from "@/components/form/ingresar-casillero/IngresarCasilleroForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Casillero",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Casillero" />
            <IngresarCasilleroForm />
        </div>
    );
}
