"use client";
import { useState } from "react";

export const useNuevoUsuario = () => {
    const [formData, setFormData] = useState({
        nombre: "",
        cedula: "",
        correo: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        password: "", 
        role: "",
    });

    const [errors, setErrors] = useState({
        nombre: "",
        cedula: "",
        correo: "",
        telefono: "",
        direccion: "",
        ciudad: "",
    });

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        const newErrors: any = {};

        if (!formData.nombre.trim()) newErrors.nombre = "Nombre requerido";
        if (!formData.cedula.trim()) newErrors.cedula = "Cédula requerida";
        if (!formData.correo.trim()) newErrors.correo = "Correo requerido";
        if (!formData.telefono.trim()) newErrors.telefono = "Teléfono requerido";
        if (!formData.direccion.trim()) newErrors.direccion = "Dirección requerida";
        if (!formData.ciudad.trim()) newErrors.ciudad = "Ciudad requerida";
        if (!formData.password.trim()) newErrors.password = "Contraseña requerida";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return {
        formData,
        errors,
        handleChange,
        validate,
        setFormData,
    };
};
