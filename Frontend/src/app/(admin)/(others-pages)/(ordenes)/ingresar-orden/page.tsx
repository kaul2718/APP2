import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IngresarOrdenForm from "@/components/form/ingresar-orden/IngresarOrdenForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Ingresar Orden",
};

export default function Page() {
    return (
        <div className="max-w-3xl mx-auto px-4">
            <PageBreadcrumb pageTitle="Ingresar Orden" />
            <IngresarOrdenForm />
        </div>
    );
}
