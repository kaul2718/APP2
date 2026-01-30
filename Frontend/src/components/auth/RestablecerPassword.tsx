"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";

export default function RestablecerPassword() {
    const router = useRouter();
    const [correo, setCorreo] = useState("");
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const validateFields = () => {
        const newErrors: string[] = [];

        if (!correo.trim()) {
            newErrors.push("El correo es requerido");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            newErrors.push("Correo electrónico inválido");
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateFields()) return;

        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/restablecer-contrasena`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ correo })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al solicitar restablecimiento");
            }

            toast.success("Se ha enviado un enlace a tu correo para restablecer la contraseña");
            router.push("/signin");
        } catch (error) {
            if (error instanceof Error) {
                setErrors([error.message]);
                toast.error(error.message);
            } else {
                setErrors(["Ocurrió un error inesperado"]);
                toast.error("Ocurrió un error inesperado");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full">
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                            Restablecer Contraseña
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ingresa tu correo electrónico para recibir un enlace de restablecimiento
                        </p>
                    </div>

                    <div>
                        {/* FORMULARIO */}
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                <div>
                                    <Label>
                                        Correo Electrónico <span className="text-error-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <EnvelopeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                        <Input
                                            type="email"
                                            placeholder="Ej: usuario@example.com"
                                            value={correo}
                                            onChange={(e) => setCorreo(e.target.value)}
                                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Button className="w-full" size="sm" type="submit" loading={loading}>
                                        Enviar Enlace
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {/* Mostrar errores */}
                        {errors.length > 0 && (
                            <div className="mt-5 text-red-600">
                                <ul className="space-y-1">
                                    {errors.map((err) => (
                                        <li key={err} className="text-sm">• {err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-5">
                            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
                                ¿Recuerdas tu contraseña?{" "}
                                <Link
                                    href="/signin"
                                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                >
                                    Inicia sesión
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}