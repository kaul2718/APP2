"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { UserIcon, IdentificationIcon, EnvelopeIcon, PhoneIcon, HomeIcon, MapIcon } from "@heroicons/react/24/outline";
import { Role } from "@/types/role";
import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js';

interface FormData {
    cedula: string;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    role: Role;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (user: any) => void;
}

export default function AgregarClienteModal({ isOpen, onClose, onSuccess }: Props) {
    const { data: session } = useSession();
    const cedulaInputId = React.useId();
    const nombreInputId = React.useId();
    const apellidoInputId = React.useId();
    const correoInputId = React.useId();
    const telefonoInputId = React.useId();
    const direccionInputId = React.useId();
    const ciudadInputId = React.useId();
    const roleSelectId = React.useId();

    const [formData, setFormData] = React.useState<FormData>({
        cedula: "",
        nombre: "",
        apellido: "",
        correo: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        role: Role.CLIENT
    });
    const [errors, setErrors] = React.useState<Partial<FormData>>({});
    const [loading, setLoading] = React.useState(false);
    const [buscandoSri, setBuscandoSri] = React.useState(false);
    const [mensajeSri, setMensajeSri] = React.useState<{ tipo: "exito" | "error" | "cargando"; texto: string } | null>(null);

    const handleChange = React.useCallback((field: keyof FormData, value: string | Role) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    }, []);

    const handleTelefonoChange = React.useCallback((value: string) => {
        // Formatear dinámicamente con AsYouType para Ecuador
        const formatted = new AsYouType('EC').input(value);
        handleChange("telefono", formatted);
    }, [handleChange]);

    const consultarDocumentoSri = React.useCallback(async (doc: string) => {
        if (!doc || (doc.length !== 10 && doc.length !== 13)) return;
        const token = session?.accessToken;
        if (!token) return;

        setBuscandoSri(true);
        setMensajeSri({ tipo: "cargando", texto: "⏳ Consultando datos de Registro Civil / SRI..." });

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/sri/consultar/${doc}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("No se encontraron registros");
            }

            const data = await response.json();
            if (data && data.success) {
                setMensajeSri({ tipo: "exito", texto: "✅ Datos encontrados" });
                
                const partes = data.name.trim().split(/\s+/);
                if (partes.length >= 4) {
                    handleChange("nombre", `${partes[2]} ${partes[3] || ""}`.trim());
                    handleChange("apellido", `${partes[0]} ${partes[1]}`.trim());
                } else if (partes.length === 3) {
                    handleChange("nombre", partes[2]);
                    handleChange("apellido", `${partes[0]} ${partes[1]}`);
                } else if (partes.length === 2) {
                    handleChange("nombre", partes[1]);
                    handleChange("apellido", partes[0]);
                } else {
                    handleChange("nombre", data.name);
                    handleChange("apellido", ".");
                }

                if (data.address) {
                    handleChange("direccion", data.address);
                    handleChange("ciudad", data.city || "QUITO");
                }
            } else {
                setMensajeSri({ tipo: "error", texto: "❌ No se encontró información" });
            }
        } catch (error) {
            setMensajeSri({ tipo: "error", texto: "❌ No se encontró información" });
        } finally {
            setBuscandoSri(false);
        }
    }, [session?.accessToken, handleChange]);

    React.useEffect(() => {
        if (formData.cedula.length === 10 || formData.cedula.length === 13) {
            consultarDocumentoSri(formData.cedula);
        } else {
            setMensajeSri(null);
        }
    }, [formData.cedula, consultarDocumentoSri]);

    const validateFields = () => {
        const newErrors: Partial<FormData> = {};

        if (!formData.cedula.trim()) {
            newErrors.cedula = "La cédula o RUC es requerido";
        } else if (!/^\d{10}$|^\d{13}$/.test(formData.cedula)) {
            newErrors.cedula = "El documento debe tener 10 o 13 dígitos";
        }

        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre es requerido";
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
        }

        if (!formData.correo.trim()) {
            newErrors.correo = "El correo es requerido";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
            newErrors.correo = "Correo electrónico inválido";
        }

        if (!formData.telefono.trim()) {
            newErrors.telefono = "El teléfono es requerido";
        } else {
            const parsedPhone = parsePhoneNumberFromString(formData.telefono, 'EC');
            if (!parsedPhone || !parsedPhone.isValid()) {
                newErrors.telefono = "Teléfono de Ecuador no válido (Celular o Fijo)";
            }
        }

        if (!formData.direccion.trim()) {
            newErrors.direccion = "La dirección es requerida";
        }

        if (!formData.ciudad.trim()) {
            newErrors.ciudad = "La ciudad es requerida";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const enviarCorreoInvitacion = async (email: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/enviar-invitacion`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({ correo: email }),
            });

            if (!res.ok) {
                let msg = 'Error al enviar invitación';
                try {
                    const data = await res.json();
                    msg = data.message || msg;
                } catch (e) {}
                throw new Error(msg);
            }

            return await res.json();
        } catch (error) {
            console.error("Error enviando invitación:", error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.accessToken) {
            toast.error("No hay sesión activa. Por favor, inicie sesión.");
            return;
        }

        setLoading(true);

        if (!validateFields()) {
            setLoading(false);
            return;
        }

        try {
            // Limpiar datos para enviar (no enviar password si es null)
            const { ...payload } = formData;
            
            // 1. Registrar usuario
            const registroResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!registroResponse.ok) {
                let errorMessage = "Error al registrar usuario";
                try {
                    const errorData = await registroResponse.json();
                    errorMessage = errorData.message || errorMessage;
                    if (registroResponse.status === 401) {
                        errorMessage = "No autorizado. Token inválido o expirado";
                    } else if (registroResponse.status === 409) {
                        errorMessage = errorData.message || "El usuario ya existe";
                    }
                } catch (parseError) {
                    console.error("Error al parsear respuesta de error:", parseError);
                }
                throw new Error(errorMessage);
            }

            const nuevoUsuario = await registroResponse.json();

            // 2. Enviar invitación por correo
            await enviarCorreoInvitacion(formData.correo);

            toast.success("Cliente registrado e invitación enviada con éxito ✅");

            // Reset form
            setFormData({
                cedula: "",
                nombre: "",
                apellido: "",
                correo: "",
                telefono: "",
                direccion: "",
                ciudad: "",
                role: Role.CLIENT
            });
            setMensajeSri(null);

            onClose();
            if (onSuccess) onSuccess(nuevoUsuario);

        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message || "Error al procesar la solicitud");
            } else {
                toast.error("Error desconocido al procesar la solicitud");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-3xl" title="Registrar Nuevo Cliente">
            <div className="no-scrollbar relative w-full overflow-y-auto rounded-2xl bg-white p-5 dark:bg-gray-900 sm:p-6">
                <h2 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                    Registrar nuevo cliente
                </h2>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Complete los datos del cliente. Se enviará automáticamente un correo para que establezca su contraseña.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="custom-scrollbar max-h-[62vh] overflow-y-auto pr-1">
                        <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2">
                            {/* Cédula */}
                            <div>
                                <Label htmlFor={cedulaInputId}>Cédula / RUC *</Label>
                                <div className="relative">
                                    <IdentificationIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                    <Input
                                        id={cedulaInputId}
                                        value={formData.cedula}
                                        onChange={(e) => handleChange("cedula", e.target.value)}
                                        placeholder="Ej: 1234567890 o RUC"
                                        maxLength={13}
                                        className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                                    />
                                </div>
                                {mensajeSri && (
                                    <p className={`text-xs mt-1 font-medium ${
                                        mensajeSri.tipo === "exito" ? "text-green-600 dark:text-green-400" :
                                        mensajeSri.tipo === "error" ? "text-red-500" :
                                        "text-blue-500 dark:text-blue-400 animate-pulse"
                                    }`}>
                                        {mensajeSri.texto}
                                    </p>
                                )}
                                {errors.cedula && <p className="text-sm text-red-500 mt-1">{errors.cedula}</p>}
                            </div>

                            {/* Nombre */}
                            <div>
                                <Label htmlFor={nombreInputId}>Nombre *</Label>
                                <div className="relative">
                                    <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                    <Input
                                        id={nombreInputId}
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
                                <Label htmlFor={apellidoInputId}>Apellido *</Label>
                                <div className="relative">
                                    <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                    <Input
                                        id={apellidoInputId}
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
                                <Label htmlFor={correoInputId}>Correo Electrónico *</Label>
                                <div className="relative">
                                    <EnvelopeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                    <Input
                                        id={correoInputId}
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
                                <Label htmlFor={telefonoInputId}>Teléfono *</Label>
                                <div className="relative">
                                    <PhoneIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                    <Input
                                        id={telefonoInputId}
                                        value={formData.telefono}
                                        onChange={(e) => handleTelefonoChange(e.target.value)}
                                        placeholder="Ej: 099 123 4567"
                                        maxLength={16}
                                        className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                                    />
                                </div>
                                {errors.telefono && <p className="text-sm text-red-500 mt-1">{errors.telefono}</p>}
                            </div>

                            {/* Dirección */}
                            <div>
                                <Label htmlFor={direccionInputId}>Dirección *</Label>
                                <div className="relative">
                                    <HomeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                    <Input
                                        id={direccionInputId}
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
                                <Label htmlFor={ciudadInputId}>Ciudad *</Label>
                                <div className="relative">
                                    <MapIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                    <Input
                                        id={ciudadInputId}
                                        value={formData.ciudad}
                                        onChange={(e) => handleChange("ciudad", e.target.value)}
                                        placeholder="Ej: Quito"
                                        className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                                    />
                                </div>
                                {errors.ciudad && <p className="text-sm text-red-500 mt-1">{errors.ciudad}</p>}
                            </div>

                            {/* Rol (opcional si siempre será CLIENTE) */}
                            {formData.role !== Role.CLIENT && (
                                <div>
                                    <Label htmlFor={roleSelectId}>Rol</Label>
                                    <div className="relative">
                                        <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                        <select
                                            id={roleSelectId}
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
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} loading={loading}>
                            Registrar Cliente
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}