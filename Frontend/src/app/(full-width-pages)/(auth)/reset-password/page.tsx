import RestablecerPassword from "@/components/auth/RestablecerPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hospital Del Computador",
    description: "Empresa dedicada al soporte técnico",
};

export default function ResetPassword() {
    return <RestablecerPassword />;
}
