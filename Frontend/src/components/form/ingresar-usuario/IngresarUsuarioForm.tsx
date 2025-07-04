"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import PhoneInput from "@/components/form/group-input/PhoneInput";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useNuevoUsuario } from "@/hooks/useNuevoUsuario";
import { UserIcon, IdentificationIcon, EnvelopeIcon, HomeIcon, BuildingOfficeIcon, UserGroupIcon, CheckCircleIcon, } from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation';

export default function IngresarUsuarioForm() {
    const { data: session } = useSession();
    const { formData, errors, handleChange, validate, setFormData } = useNuevoUsuario();
    const router = useRouter();

    const countries = [
        { code: "EC", label: "+593" },
        { code: "US", label: "+1" },
    ];

    const validateFields = () => {
        let isValid = true;

        // Validación de nombre
        if (!formData.nombre.trim()) {
            toast.error("El nombre completo es requerido");
            isValid = false;
        } else if (formData.nombre.trim().length < 3) {
            toast.error("El nombre debe tener al menos 3 caracteres");
            isValid = false;
        }

        // Validación de cédula (Ecuador)
        if (!formData.cedula.trim()) {
            toast.error("La cédula es requerida");
            isValid = false;
        } else if (!/^\d{10}$/.test(formData.cedula)) {
            toast.error("La cédula debe tener 10 dígitos numéricos");
            isValid = false;
        }

        // Validación de correo electrónico
        if (!formData.correo.trim()) {
            toast.error("El correo electrónico es requerido");
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
            toast.error("Ingrese un correo electrónico válido");
            isValid = false;
        }

        // Validación de teléfono
        if (!formData.telefono.trim()) {
            toast.error("El teléfono es requerido");
            isValid = false;
        } else if (!/^\+?\d{7,15}$/.test(formData.telefono.replace(/\s/g, ''))) {
            toast.error("Ingrese un número de teléfono válido");
            isValid = false;
        }

        // Validación de dirección
        if (!formData.direccion.trim()) {
            toast.error("La dirección es requerida");
            isValid = false;
        } else if (formData.direccion.trim().length < 10) {
            toast.error("La dirección debe tener al menos 10 caracteres");
            isValid = false;
        }

        // Validación de ciudad
        if (!formData.ciudad.trim()) {
            toast.error("La ciudad es requerida");
            isValid = false;
        }

        // Validación de rol
        if (!formData.role) {
            toast.error("Debe seleccionar un rol");
            isValid = false;
        }

        // Validación de contraseña
        if (!formData.password) {
            toast.error("La contraseña es requerida");
            isValid = false;
        } else if (formData.password.length < 8) {
            toast.error("La contraseña debe tener al menos 8 caracteres");
            isValid = false;
        } else if (!/[A-Z]/.test(formData.password)) {
            toast.error("La contraseña debe contener al menos una mayúscula");
            isValid = false;
        } else if (!/[0-9]/.test(formData.password)) {
            toast.error("La contraseña debe contener al menos un número");
            isValid = false;
        } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
            toast.error("La contraseña debe contener al menos un carácter especial");
            isValid = false;
        }

        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateFields()) {
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.token || ""}`,
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Error:", errorData);
                toast.error(errorData.message || "Error al registrar usuario");
                return;
            }

            toast.success("Usuario registrado con éxito ✅");

            // Redirigir después de 2 segundos (para que el usuario vea el mensaje)
            setTimeout(() => {
                router.push('/ver-usuario');
            }, 1000);

            setFormData({
                nombre: "",
                cedula: "",
                correo: "",
                telefono: "",
                direccion: "",
                ciudad: "",
                password: "",
                role: "",
            });
        } catch (error) {
            console.error(error);
            toast.error("Error en la solicitud");
        }
    };

    return (
        <ComponentCard title="Registrar Usuario">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                    <Label>Nombre completo</Label>
                    <div className="relative">
                        <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.nombre}
                            onChange={(e) => handleChange("nombre", e.target.value)}
                            placeholder="Ej: Kevin Alex"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
                </div>

                {/* Cédula */}
                <div>
                    <Label>Cédula</Label>
                    <div className="relative">
                        <IdentificationIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.cedula}
                            onChange={(e) => handleChange("cedula", e.target.value)}
                            placeholder="Ej: 0102030405"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.cedula && <p className="text-sm text-red-500 mt-1">{errors.cedula}</p>}
                </div>

                {/* Correo */}
                <div>
                    <Label>Correo electrónico</Label>
                    <div className="relative">
                        <EnvelopeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.correo}
                            onChange={(e) => handleChange("correo", e.target.value)}
                            placeholder="Ej: correo@email.com"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.correo && <p className="text-sm text-red-500 mt-1">{errors.correo}</p>}
                </div>

                {/* Teléfono */}
                <div>
                    <Label>Teléfono</Label>
                    <div className="relative">
                        <PhoneInput
                            countries={countries}
                            selectPosition="start"
                            placeholder="0999990000"
                            onChange={(value) => handleChange("telefono", value)}
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.telefono && <p className="text-sm text-red-500 mt-1">{errors.telefono}</p>}
                </div>

                {/* Dirección */}
                <div>
                    <Label>Dirección</Label>
                    <div className="relative">
                        <HomeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.direccion}
                            onChange={(e) => handleChange("direccion", e.target.value)}
                            placeholder="Ej: Av. 6 de Diciembre y Eloy Alfaro"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.direccion && <p className="text-sm text-red-500 mt-1">{errors.direccion}</p>}
                </div>

                {/* Ciudad */}
                <div>
                    <Label>Ciudad</Label>
                    <div className="relative">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.ciudad}
                            onChange={(e) => handleChange("ciudad", e.target.value)}
                            placeholder="Ej: Riobamba"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.ciudad && <p className="text-sm text-red-500 mt-1">{errors.ciudad}</p>}
                </div>

                {/* Rol */}
                <div>
                    <Label>Rol</Label>
                    <div className="relative">
                        <UserGroupIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <select
                            className="w-full border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-700 dark:text-white p-2 pl-10 bg-white text-black"
                            value={formData.role}
                            onChange={(e) => handleChange("role", e.target.value)}
                        >
                            <option value="">Seleccionar rol</option>
                            <option value="Cliente">Cliente</option>
                            <option value="Administrador">Administrador</option>
                            <option value="Técnico">Técnico</option>
                            <option value="Recepcionista">Recepcionista</option>
                        </select>
                    </div>
                    {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
                </div>

                {/* Contraseña */}
                <div>
                    <Label>Contraseña</Label>
                    <div className="relative">
                        <Input
                            type="password"
                            value={formData.password || ""}
                            onChange={(e) => handleChange("password", e.target.value)}
                            placeholder="Ingrese una contraseña segura"
                            className="pl-4 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                </div>

                {/* Botón */}
                <div className="md:col-span-2">
                    <Button type="submit" className="w-full flex items-center justify-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        Registrar
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}