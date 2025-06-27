import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hospital Del Computador",
  description: "Empresa dedicada al soporte técnico",
};

export default function SignIn() {
  return <SignInForm />;
}
