// src/hooks/useLogin.ts
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const handleIdentificadorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdentificador(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    const cleanInput = identificador.trim();
    if (!cleanInput) {
      setErrors(["Por favor, ingresa tu cédula o correo electrónico."]);
      return;
    }
    if (!password) {
      setErrors(["Por favor, ingresa tu contraseña."]);
      return;
    }

    setLoading(true);
    try {
      const response = await signIn("credentials", {
        identificador: cleanInput,
        correo: cleanInput,
        password,
        redirect: false,
      });

      if (response?.ok) {
        router.push("/dashboard");
      } else {
        const errorMsg =
          response?.error && response.error !== "CredentialsSignin"
            ? response.error
            : "Credenciales incorrectas o usuario no encontrado.";
        setErrors([errorMsg]);
      }
    } catch (err: any) {
      setErrors([err.message || "Error al conectar con el servidor."]);
    } finally {
      setLoading(false);
    }
  };

  return {
    showPassword,
    toggleShowPassword,
    identificador,
    correo: identificador, // Retrocompatibilidad
    password,
    errors,
    loading,
    handleIdentificadorChange,
    handleCorreoChange: handleIdentificadorChange, // Retrocompatibilidad
    handlePasswordChange,
    handleSubmit,
  };
}
