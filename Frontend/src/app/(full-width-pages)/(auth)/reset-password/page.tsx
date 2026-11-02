import RestablecerPassword from "@/components/auth/RestablecerPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Restablecer Contraseña",
    description: "Recuperación de acceso al sistema de Hospital del Computador.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function ResetPassword() {
    return <RestablecerPassword />;
}
