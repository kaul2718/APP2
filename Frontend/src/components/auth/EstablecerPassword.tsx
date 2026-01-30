"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";

export default function EstablecerPassword() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: ""
    });
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleShowPassword = () => setShowPassword(!showPassword);
    const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateFields = () => {
        const newErrors: string[] = [];

        if (!formData.password) {
            newErrors.push("La contraseña es requerida");
        } else if (formData.password.length < 8) {
            newErrors.push("La contraseña debe tener al menos 8 caracteres");
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.push("Las contraseñas no coinciden");
        }

        if (!token) {
            newErrors.push("Token inválido o faltante");
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateFields()) return;

        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/guardar-clave`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token,
                    password: formData.password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al establecer la contraseña");
            }

            toast.success("Contraseña establecida con éxito. Ya puedes iniciar sesión.");
            router.push("/signin");
        } catch (error) {
            if (error instanceof Error) {
                // Muestra el toast con el mensaje del backend
                if (error.message.includes("utilizado") || error.message.includes("expirado")) {
                    toast.error("El enlace ya fue usado o ha expirado. Solicita uno nuevo.");
                } else {
                    toast.error(error.message);
                }
                setErrors([error.message]);
            } else {
                toast.error("Ocurrió un error inesperado");
                setErrors(["Ocurrió un error inesperado"]);
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
                            Establecer Contraseña
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Crea una nueva contraseña para tu cuenta
                        </p>
                    </div>

                    <div>
                        {/* FORMULARIO */}
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                <div>
                                    <Label>
                                        Nueva Contraseña <span className="text-error-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Mínimo 8 caracteres"
                                            value={formData.password}
                                            onChange={(e) => handleChange("password", e.target.value)}
                                        />
                                        <span
                                            onClick={toggleShowPassword}
                                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                        >
                                            {showPassword ? (
                                                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                                            ) : (
                                                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <Label>
                                        Confirmar Contraseña <span className="text-error-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirma tu contraseña"
                                            value={formData.confirmPassword}
                                            onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                        />
                                        <span
                                            onClick={toggleShowConfirmPassword}
                                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                                            ) : (
                                                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <Button className="w-full" size="sm" type="submit" loading={loading}>
                                        Establecer Contraseña
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
                                ¿Ya tienes una cuenta?{" "}
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
