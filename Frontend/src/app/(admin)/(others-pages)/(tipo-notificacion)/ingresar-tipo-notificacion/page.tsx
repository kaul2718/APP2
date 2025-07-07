import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarTipoNotificacionForm from "@/components/form/ingresar-tipo-notificacion/IngresarTipoNotificacionForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Tipo Notificación",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Tipo Notificación" />
            <IngresarTipoNotificacionForm />
        </div>
    );
}
