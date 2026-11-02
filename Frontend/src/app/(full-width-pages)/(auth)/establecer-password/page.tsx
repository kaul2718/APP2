import EstablecerPassword from "@/components/auth/EstablecerPassword";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Establecer Contraseña",
    description: "Establecer nueva contraseña de acceso.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function Password() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
            <EstablecerPassword />
        </Suspense>
    );
}
