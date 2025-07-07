"use client";
import React from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { CubeIcon } from "@heroicons/react/24/outline";

interface FormData {
  nombre: string;
}

interface Props {
  onSuccess?: (newTipoEquipo: { id: number; nombre: string }) => void;
  onClose?: () => void;
}

export default function IngresarTipoEquipoForm({ onSuccess, onClose }: Props) {
  const { data: session } = useSession();
  const [formData, setFormData] = React.useState<FormData>({
    nombre: ""
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
      newErrors.nombre = "El nombre del tipo de equipo es requerido";
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tipos-equipo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken || ""}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error:", errorData);
        toast.error(errorData.message || "Error al registrar tipo de equipo");
        return;
      }

      const newTipoEquipo = await res.json();
      toast.success("Tipo de equipo registrado con éxito ✅");

      setFormData({ nombre: "" });

      // Llamar a onSuccess si está definido
      if (onSuccess) {
        onSuccess(newTipoEquipo);
      }

      // Cerrar el modal si está definido onClose
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error(error);
      toast.error("Error en la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        {/* Nombre del tipo de equipo */}
        <div>
          <Label>Nombre del Tipo de Equipo</Label>
          <div className="relative">
            <CubeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ej: Laptop, Impresora, Servidor"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4">
          {onClose && (
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
            className="flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrar Tipo de Equipo"}
          </Button>
        </div>
      </form>
    </div>
  );
}