"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { DocumentTextIcon } from "@heroicons/react/24/outline";

interface FormData {
    nombre: string;
    descripcion: string;
}

interface Props {
    embeddedMode?: boolean;
    onSuccess?: () => void;
    onClose?: () => void;
}

export default function IngresarEstadoOrdenForm({
    embeddedMode = false,
    onSuccess,
    onClose,
}: Props) {
    const { data: session } = useSession();
    const router = useRouter();
    const [formData, setFormData] = React.useState<FormData>({
        nombre: "",
        descripcion: ""
    });
    const [errors, setErrors] = React.useState<Partial<FormData>>({});
    const [loading, setLoading] = React.useState(false);

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateFields = () => {
        const newErrors: Partial<FormData> = {};
        let isValid = true;

        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre del estado es requerido";
            isValid = false;
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
            isValid = false;
        } else if (formData.nombre.trim().length > 50) {
            newErrors.nombre = "El nombre no puede exceder los 50 caracteres";
            isValid = false;
        }

        if (formData.descripcion && formData.descripcion.length > 500) {
            newErrors.descripcion = "La descripción no puede exceder los 500 caracteres";
            isValid = false;
        }

        setErrors(newErrors);

        if (!isValid) {
            const firstErrorKey = Object.keys(newErrors)[0];
            if (firstErrorKey) {
                const element = document.querySelector(`[name="${firstErrorKey}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateFields()) {
            return;
        }

        setLoading(true);

        try {
            if (!session?.accessToken) {
                throw new Error("No hay sesión activa");
            }

            if (!formData.nombre.trim()) {
                throw new Error("El nombre no puede estar vacío");
            }

            if (formData.descripcion && formData.descripcion.length > 500) {
                throw new Error("La descripción no puede exceder los 500 caracteres");
            }

            const payload = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion?.trim() || null
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/estados-orden`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(8000)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));

                if (res.status === 409) {
                    throw new Error("Ya existe un estado de orden con ese nombre");
                } else if (res.status === 400) {
                    throw new Error(errorData.message || "Datos inválidos");
                } else if (res.status === 401) {
                    throw new Error("No autorizado - sesión expirada");
                } else if (res.status >= 500) {
                    throw new Error("Error en el servidor");
                } else {
                    throw new Error(`Error ${res.status}: ${res.statusText}`);
                }
            }

            const data = await res.json();

            if (!data.id || !data.nombre) {
                throw new Error("Respuesta inválida del servidor");
            }

            toast.success("Estado de orden registrado con éxito ✅", {
                autoClose: 2000,
                pauseOnHover: false
            });

            setFormData({ nombre: "", descripcion: "" });
            setErrors({});

            if (embeddedMode) {
                onSuccess?.();
                onClose?.();
            } else {
                setTimeout(() => {
                    router.push('/ver-estado-orden');
                }, 1000);
            }
        } catch (error) {
            console.error("Error en el formulario:", error);

            let errorMessage = "Error al registrar estado de orden";

            if (error instanceof DOMException && error.name === "AbortError") {
                errorMessage = "La solicitud tardó demasiado. Intente nuevamente";
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast.error(errorMessage, {
                autoClose: 5000,
                pauseOnHover: true
            });

            if (!formData.nombre.trim()) {
                const nombreInput = document.querySelector('input[name="nombre"]');
                if (nombreInput instanceof HTMLElement) {
                    nombreInput.focus();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const nombreInputId = React.useId();
    const descTextareaId = React.useId();

    const formContent = (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
            <div>
                <Label htmlFor={nombreInputId}>Nombre del Estado</Label>
                <div className="relative">
                    <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                    <Input
                        id={nombreInputId}
                        name="nombre"
                        value={formData.nombre}
                        onChange={(e) => handleChange("nombre", e.target.value)}
                        placeholder="Ej: Pendiente, En Proceso, Completado"
                        className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                    />
                </div>
                {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
            </div>

            <div>
                <Label htmlFor={descTextareaId}>Descripción (Opcional)</Label>
                <textarea
                    id={descTextareaId}
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleChange("descripcion", e.target.value)}
                    placeholder="Descripción del estado de orden"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
                    rows={3}
                />
                {errors.descripcion && <p className="text-sm text-red-500 mt-1">{errors.descripcion}</p>}
                <p className="text-xs text-gray-500 mt-1">
                    {formData.descripcion.length}/500 caracteres
                </p>
            </div>

            <div className={embeddedMode ? "flex justify-end gap-4" : ""}>
                {embeddedMode && onClose && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                )}
                <Button
                    type="submit"
                    className={embeddedMode ? "flex items-center justify-center gap-2" : "w-full flex items-center justify-center gap-2"}
                    disabled={loading}
                >
                    {loading ? "Registrando..." : "Registrar Estado"}
                </Button>
            </div>
        </form>
    );

    if (embeddedMode) {
        return <div className="p-4">{formContent}</div>;
    }

    return <ComponentCard title="Registrar Nuevo Estado de Orden">{formContent}</ComponentCard>;
}