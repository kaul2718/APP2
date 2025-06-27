import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hospital Del Computador",
  description: "Empresa dedicada al soporte técnico",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
