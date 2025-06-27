// src/hooks/useLogin.ts
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const handleCorreoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCorreo(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);
    // 🔍 Mostrar los datos que se están enviando
    console.log("Enviando datos al signIn:", {
      correo,
      password,
    });

    const response = await signIn("credentials", {
      correo,
      password,
      redirect: false,
    });


    if (response instanceof Response) {
      console.log("Es un Response real, vamos a extraer su JSON manualmente");
      const json = await response.json();
      console.log("Contenido del response.json():", json);
    }

    if (response?.ok) {
      router.push("/profile"); // Redirige solo si login fue exitoso
    } else {
      setErrors(["Credenciales incorrectas o usuario no encontrado."]);
    }
  };

  return {
    showPassword,
    toggleShowPassword,
    correo,
    password,
    errors,
    handleCorreoChange,
    handlePasswordChange,
    handleSubmit,
  };
}
