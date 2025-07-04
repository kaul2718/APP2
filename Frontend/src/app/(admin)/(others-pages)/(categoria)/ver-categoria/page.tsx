import React from "react";
import { Metadata } from "next";
import CategoriaComponent from "./CategoriaComponent";

export const metadata: Metadata = {
    title: "Hospital del Computador",
    description: "Página para visualización de categorias",
};

export default function Page() {
    return <CategoriaComponent />;
}
