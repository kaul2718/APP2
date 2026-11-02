import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Acceso al sistema administrativo de Hospital del Computador.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignIn() {
  return <SignInForm />;
}
