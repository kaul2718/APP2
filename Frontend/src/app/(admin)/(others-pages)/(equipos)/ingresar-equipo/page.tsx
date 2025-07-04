import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarEquipoForm from "@/components/form/ingresar-equipo/IngresarEquipoForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar equipo",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Equipo" />
            <IngresarEquipoForm />
        </div>
    );
}
