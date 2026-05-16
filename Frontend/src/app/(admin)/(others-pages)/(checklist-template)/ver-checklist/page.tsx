import React from "react";
import { Metadata } from "next";
import ChecklistComponent from "./ChecklistComponent";

export const metadata: Metadata = {
    title: "Hospital del Computador - Checklists",
    description: "Configuración de plantillas de peritaje técnico",
};

export default function Page() {
    return <ChecklistComponent />;
}
