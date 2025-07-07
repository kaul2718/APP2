"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Select } from "@headlessui/react";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { UserIcon, IdentificationIcon, EnvelopeIcon, PhoneIcon, HomeIcon, MapIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { Role } from "@/types/role";

interface FormData {
    cedula: string;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    password: string;
    confirmPassword: string;
    role: Role;
}

export default function IngresarUsuarioNuevoForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const [formData, setFormData] = React.useState<FormData>({
        cedula: "",
        nombre: "",
        apellido: "",
        correo: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        password: "",
        confirmPassword: "",
        role: Role.CLIENT
    });
    const [errors, setErrors] = React.useState<Partial<FormData>>({});
    const [loading, setLoading] = React.useState(false);

    const handleChange = (field: keyof FormData, value: string | Role) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateFields = () => {
        const newErrors: Partial<FormData> = {};

        // Validación de cédula (10 dígitos)
        if (!formData.cedula.trim()) {
            newErrors.cedula = "La cédula es requerida";
        } else if (!/^\d{10}$/.test(formData.cedula)) {
            newErrors.cedula = "La cédula debe tener 10 dígitos";
        }

        // Validación de nombre
        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre es requerido";
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
        }

        // Validación de correo
        if (!formData.correo.trim()) {
            newErrors.correo = "El correo es requerido";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
            newErrors.correo = "Correo electrónico inválido";
        }

        // Validación de teléfono
        if (!formData.telefono.trim()) {
            newErrors.telefono = "El teléfono es requerido";
        } else if (!/^\d{10}$/.test(formData.telefono)) {
            newErrors.telefono = "El teléfono debe tener 10 dígitos";
        }

        // Validación de dirección
        if (!formData.direccion.trim()) {
            newErrors.direccion = "La dirección es requerida";
        }

        // Validación de ciudad
        if (!formData.ciudad.trim()) {
            newErrors.ciudad = "La ciudad es requerida";
        }

        // Validación de contraseña
        if (!formData.password) {
            newErrors.password = "La contraseña es requerida";
        } else if (formData.password.length < 8) {
            newErrors.password = "La contraseña debe tener al menos 8 caracteres";
        }

        // Validación de confirmación de contraseña
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Verificar sesión primero
        if (!session?.accessToken) {
            toast.error("No hay sesión activa. Por favor, inicie sesión.");
            return;
        }

        setLoading(true);

        // Validación de campos
        if (!validateFields()) {
            setLoading(false);
            return;
        }

        try {
            // Validar URL del backend
            if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
                throw new Error("Configuración de backend no disponible");
            }

            const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`;
            const payload = {
                cedula: formData.cedula,
                nombre: formData.nombre,
                apellido: formData.apellido,
                correo: formData.correo,
                telefono: formData.telefono,
                direccion: formData.direccion,
                ciudad: formData.ciudad,
                password: formData.password,
                role: formData.role
            };

            // Validar payload antes de enviar
            if (Object.values(payload).some(val => val === undefined || val === null)) {
                throw new Error("Datos del formulario incompletos");
            }

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            // Manejar errores HTTP
            if (!res.ok) {
                let errorMessage = "Error al registrar usuario";

                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;

                    // Manejo específico de errores comunes
                    if (res.status === 401) {
                        errorMessage = "No autorizado. Token inválido o expirado";
                    } else if (res.status === 409) {
                        errorMessage = errorData.message || "El usuario ya existe";
                    }
                } catch (parseError) {
                    console.error("Error al parsear respuesta de error:", parseError);
                }

                throw new Error(errorMessage);
            }

            // Procesar respuesta exitosa
            const data = await res.json();

            // Validar respuesta del servidor
            if (!data || !data.id) {
                throw new Error("Respuesta inválida del servidor");
            }

            toast.success("Usuario registrado con éxito ✅");

            // Resetear formulario
            setFormData({
                cedula: "",
                nombre: "",
                apellido: "",
                correo: "",
                telefono: "",
                direccion: "",
                ciudad: "",
                password: "",
                confirmPassword: "",
                role: Role.CLIENT
            });

            // Redirección con manejo de error
            try {
                await router.push('/ver-usuario');
            } catch (navigationError) {
                console.error("Error en redirección:", navigationError);
                toast.warning("Usuario creado pero hubo un error en la redirección");
            }

        } catch (error) {
            //.error("Error en el proceso:", error);

            // Mostrar mensajes de error específicos
            if (error instanceof Error) {
                toast.error(error.message || "Error al procesar la solicitud");
            } else {
                toast.error("Error desconocido al procesar la solicitud");
            }

            // Opcional: enviar error a servicio de monitoreo
            // logErrorToService(error);

        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Registrar Nuevo Usuario">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cédula */}
                <div>
                    <Label>Cédula</Label>
                    <div className="relative">
                        <IdentificationIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.cedula}
                            onChange={(e) => handleChange("cedula", e.target.value)}
                            placeholder="Ej: 1234567890"
                            maxLength={10}
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.cedula && <p className="text-sm text-red-500 mt-1">{errors.cedula}</p>}
                </div>

                {/* Nombre */}
                <div>
                    <Label>Nombre</Label>
                    <div className="relative">
                        <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.nombre}
                            onChange={(e) => handleChange("nombre", e.target.value)}
                            placeholder="Ej: Juan"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
                </div>

                {/* Apellido */}
                <div>
                    <Label>Apellido</Label>
                    <div className="relative">
                        <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.apellido}
                            onChange={(e) => handleChange("apellido", e.target.value)}
                            placeholder="Ej: Pérez"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.apellido && <p className="text-sm text-red-500 mt-1">{errors.apellido}</p>}
                </div>

                {/* Correo */}
                <div>
                    <Label>Correo Electrónico</Label>
                    <div className="relative">
                        <EnvelopeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            type="email"
                            value={formData.correo}
                            onChange={(e) => handleChange("correo", e.target.value)}
                            placeholder="Ej: usuario@example.com"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.correo && <p className="text-sm text-red-500 mt-1">{errors.correo}</p>}
                </div>

                {/* Teléfono */}
                <div>
                    <Label>Teléfono</Label>
                    <div className="relative">
                        <PhoneIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.telefono}
                            onChange={(e) => handleChange("telefono", e.target.value)}
                            placeholder="Ej: 0987654321"
                            maxLength={10}
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
                            placeholder="Ej: Av. Principal 123"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.direccion && <p className="text-sm text-red-500 mt-1">{errors.direccion}</p>}
                </div>

                {/* Ciudad */}
                <div>
                    <Label>Ciudad</Label>
                    <div className="relative">
                        <MapIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.ciudad}
                            onChange={(e) => handleChange("ciudad", e.target.value)}
                            placeholder="Ej: Quito"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.ciudad && <p className="text-sm text-red-500 mt-1">{errors.ciudad}</p>}
                </div>

                {/* Rol */}
                <div>
                    <Label>Rol</Label>
                    <div className="relative">
                        {/* Puedes usar otro ícono que represente mejor el "Rol" */}
                        <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <select
                            value={formData.role}
                            onChange={(e) => handleChange("role", e.target.value as Role)}
                            className="pl-10 pr-4 py-2 w-full rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.values(Role).map((role) => (
                                <option key={role} value={role}>
                                    {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
                </div>

                {/* Contraseña */}
                <div>
                    <Label>Contraseña</Label>
                    <div className="relative">
                        <LockClosedIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                </div>

                {/* Confirmar Contraseña */}
                <div>
                    <Label>Confirmar Contraseña</Label>
                    <div className="relative">
                        <LockClosedIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleChange("confirmPassword", e.target.value)}
                            placeholder="Confirma tu contraseña"
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>

                {/* Botón de envío - Ocupa 2 columnas en pantallas medianas/grandes */}
                <div className="md:col-span-2">
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? "Registrando..." : "Registrar Usuario"}
                    </Button>
                </div>
            </form>
        </ComponentCard>
    );
}