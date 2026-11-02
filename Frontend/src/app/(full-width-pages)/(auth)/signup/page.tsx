import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro de Usuario",
  description: "Registro de usuarios de Hospital del Computador.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUp() {
  return <SignUpForm />;
}
