"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { DocumentTextIcon, ScaleIcon } from "@heroicons/react/24/outline";

interface FormData {
  nombre: string;
  unidad: string;
}

export default function IngresarTipoEspecificacionForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = React.useState<FormData>({
    nombre: "",
    unidad: ""
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

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del tipo es requerido";
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    if (!formData.unidad.trim()) {
      newErrors.unidad = "La unidad de medida es requerida";
    } else if (formData.unidad.trim().length < 1) {
      newErrors.unidad = "La unidad debe tener al menos 1 carácter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validateFields()) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipo-especificacion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken || ""}`,
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          unidad: formData.unidad
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error:", errorData);
        toast.error(errorData.message || "Error al registrar tipo de especificación");
        return;
      }

      toast.success("Tipo de especificación registrado con éxito ✅");

      setFormData({ nombre: "", unidad: "" });

      setTimeout(() => {
        router.push('/ver-tipo-especificacion');
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error("Error en la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title="Registrar Nuevo Tipo de Especificación">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        {/* Nombre del tipo */}
        <div>
          <Label>Nombre del Tipo</Label>
          <div className="relative">
            <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ej: Peso, Tamaño, Capacidad"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
        </div>

        {/* Unidad de medida */}
        <div>
          <Label>Unidad de Medida</Label>
          <div className="relative">
            <ScaleIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={formData.unidad}
              onChange={(e) => handleChange("unidad", e.target.value)}
              placeholder="Ej: kg, cm, GB, MHz"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.unidad && <p className="text-sm text-red-500 mt-1">{errors.unidad}</p>}
        </div>

        {/* Botón */}
        <div>
          <Button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrar Tipo"}
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}