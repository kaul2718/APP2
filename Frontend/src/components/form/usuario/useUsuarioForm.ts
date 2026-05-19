import { useState, useCallback } from "react";
import { UsuarioFormData, UsuarioFormErrors, UsuarioFormMode } from "./types";
import { parsePhoneNumberFromString } from 'libphonenumber-js';

interface UseUsuarioFormProps {
    initialData?: UsuarioFormData;
    mode: UsuarioFormMode;
}

export function useUsuarioForm({ initialData, mode }: UseUsuarioFormProps) {
    const [formData, setFormData] = useState<UsuarioFormData>(
        initialData || {
            cedula: "",
            nombre: "",
            apellido: "",
            correo: "",
            telefono: "",
            direccion: "",
            ciudad: "",
            role: 0,
            password: "",
            confirmPassword: "",
        }
    );

    const [errors, setErrors] = useState<UsuarioFormErrors>({});
    const [camposModificados, setCamposModificados] = useState<Set<string>>(new Set());

    const handleChange = useCallback(
        (field: keyof UsuarioFormData, value: string | number | boolean | undefined) => {
            setFormData((prev) => ({ ...prev, [field]: value }));

            // Track modified fields for edit mode
            if (mode === "edit" && initialData) {
                if (initialData[field] !== value) {
                    setCamposModificados((prev) => new Set(prev).add(field));
                } else {
                    setCamposModificados((prev) => {
                        const nuevos = new Set(prev);
                        nuevos.delete(field);
                        return nuevos;
                    });
                }
            }

            // Clear error when user starts typing
            if (errors[field]) {
                setErrors((prev) => ({ ...prev, [field]: undefined }));
            }
        },
        [mode, initialData, errors]
    );

    const validateFields = useCallback((): boolean => {
        const newErrors: UsuarioFormErrors = {};

        // Validación de cédula o RUC (10 o 13 dígitos)
        if (!formData.cedula.trim()) {
            newErrors.cedula = "La identificación es requerida";
        } else if (!/^\d{10}$|^\d{13}$/.test(formData.cedula)) {
            newErrors.cedula = "Debe ser Cédula (10 dígitos) o RUC (13 dígitos)";
        }

        // Validación de nombre
        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre es requerido";
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
        }

        // Validación de apellido
        if (!formData.apellido?.trim()) {
            newErrors.apellido = "El apellido es requerido";
        } else if (formData.apellido.trim().length < 2) {
            newErrors.apellido = "El apellido debe tener al menos 2 caracteres";
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
        } else {
            const parsedPhone = parsePhoneNumberFromString(formData.telefono, 'EC');
            if (!parsedPhone || !parsedPhone.isValid()) {
                newErrors.telefono = "Teléfono de Ecuador no válido (Celular o Fijo)";
            }
        }

        // Validación de dirección
        if (!formData.direccion.trim()) {
            newErrors.direccion = "La dirección es requerida";
        }

        // Validación de ciudad
        if (!formData.ciudad.trim()) {
            newErrors.ciudad = "La ciudad es requerida";
        }

        // Validación de rol - siempre requerido
        if (!formData.role || formData.role === 0) {
            newErrors.role = "El rol es requerido";
        }

        // Password validations only in CREATE mode
        if (mode === "create") {
            if (formData.password) {
                if (formData.password.length < 8) {
                    newErrors.password = "La contraseña debe tener al menos 8 caracteres";
                } else if (!/[A-Z]/.test(formData.password)) {
                    newErrors.password = "La contraseña debe contener al menos una mayúscula";
                } else if (!/[0-9]/.test(formData.password)) {
                    newErrors.password = "La contraseña debe contener al menos un número";
                } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
                    newErrors.password = "La contraseña debe contener al menos un carácter especial";
                }
            }

            if (formData.password && formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Las contraseñas no coinciden";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, mode]);

    const reset = useCallback(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                cedula: "",
                nombre: "",
                apellido: "",
                correo: "",
                telefono: "",
                direccion: "",
                ciudad: "",
                role: 0,
                password: "",
                confirmPassword: "",
            });
        }
        setErrors({});
        setCamposModificados(new Set());
    }, [initialData]);

    return {
        formData,
        setFormData,
        errors,
        setErrors,
        handleChange,
        validateFields,
        reset,
        camposModificados,
    };
}
