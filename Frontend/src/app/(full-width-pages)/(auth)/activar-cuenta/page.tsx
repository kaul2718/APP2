import ActivarCuentaComponent from "@/components/auth/ActivarCuentaComponent";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Activa tu cuenta | Hospital del Computador",
  description: "Crea una contraseña para consultar tus reparaciones en Hospital del Computador.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ActivarCuentaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
        </div>
      }
    >
      <ActivarCuentaComponent />
    </Suspense>
  );
}
