import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RegisterFormData } from "@/types/RegisterFormData";

// hooks/useRegister.ts
export function useRegister() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerUser = async (data: RegisterFormData) => {
    setErrors([]);
    setIsSubmitting(true);

    // Excluir confirmPassword antes de enviar al backend
    const { confirmPassword, ...sendData } = data;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendData),
      });

      const responseAPI = await res.json();

      if (!res.ok) {
        setErrors(
          Array.isArray(responseAPI.message)
            ? responseAPI.message
            : [responseAPI.message]
        );
        return;
      }

      const authResponse = await signIn("credentials", {
        correo: data.correo,
        password: data.password,
        redirect: false,
      });

      if (authResponse?.error) {
        setErrors(authResponse.error.split(","));
        return;
      }

      router.push("/profile");
    } catch (error) {
      setErrors(["Ocurrió un error inesperado"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { registerUser, errors, isSubmitting };
}
