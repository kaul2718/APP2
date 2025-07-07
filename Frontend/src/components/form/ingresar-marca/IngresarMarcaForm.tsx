"use client";
import React from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { TagIcon } from "@heroicons/react/24/outline";

interface FormData {
  nombre: string;
}

interface Props {
  onSuccess?: (newMarca: { id: number; nombre: string }) => void;
  onClose?: () => void;
}

export default function IngresarMarcaForm({ onSuccess, onClose }: Props) {
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
      newErrors.nombre = "El nombre de la marca es requerido";
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/marcas`, {
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
        toast.error(errorData.message || "Error al registrar marca");
        return;
      }

      const newMarca = await res.json();
      toast.success("Marca registrada con éxito ✅");
      
      setFormData({ nombre: "" });

      if (onSuccess) onSuccess(newMarca);
      if (onClose) onClose();

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
        {/* Nombre de la Marca */}
        <div>
          <Label>Nombre de la Marca</Label>
          <div className="relative">
            <TagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ej: Sony, Samsung, LG"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
        </div>

        {/* Botón */}
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
            {loading ? "Registrando..." : "Registrar Marca"}
          </Button>
        </div>
      </form>
    </div>
  );
}