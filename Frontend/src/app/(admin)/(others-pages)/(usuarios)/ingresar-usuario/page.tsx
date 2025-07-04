import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarUsuarioForm from "@/components/form/ingresar-usuario/IngresarUsuarioForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar usuario",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Usuario" />
            <IngresarUsuarioForm />
        </div>
    );
}
