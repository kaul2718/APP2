import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarRepuestoForm from "@/components/form/ingresar-repuesto/IngresarRepuestoForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Repuesto",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Repuesto" />
            <IngresarRepuestoForm />
        </div>
    );
}
