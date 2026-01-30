import EstablecerPassword from "@/components/auth/EstablecerPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hospital Del Computador",
    description: "Empresa dedicada al soporte técnico",
};

export default function Password() {
    return <EstablecerPassword />;
}
