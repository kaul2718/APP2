import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarEstadoPresupuestoForm from "@/components/form/ingresar-estado-presupuesto/IngresarEstadoPresupuestoForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Estado Presupuesto",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Estado Presupuesto" />
            <IngresarEstadoPresupuestoForm />
        </div>
    );
}
