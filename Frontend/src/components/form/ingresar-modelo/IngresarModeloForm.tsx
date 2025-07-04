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
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { useMarcas } from "@/hooks/useMarcas";

interface FormData {
  nombre: string;
  marcaId: number | null;
}

export default function IngresarModeloForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { marcas, loading: loadingMarcas } = useMarcas();
  const [formData, setFormData] = React.useState<FormData>({
    nombre: "",
    marcaId: null
  });
  const [errors, setErrors] = React.useState<Partial<FormData>>({});
  const [loading, setLoading] = React.useState(false);

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateFields = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del modelo es requerido";
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    if (!formData.marcaId) {
      newErrors.marcaId = "Debe seleccionar una marca";
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/modelos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken || ""}`,
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          marcaId: formData.marcaId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error:", errorData);
        toast.error(errorData.message || "Error al registrar modelo");
        return;
      }

      toast.success("Modelo registrado con éxito ✅");

      setFormData({ nombre: "", marcaId: null });

      setTimeout(() => {
        router.push('/ver-modelo');
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error("Error en la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title="Registrar Nuevo Modelo">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        {/* Nombre del modelo */}
        <div>
          <Label>Nombre del Modelo</Label>
          <div className="relative">
            <DevicePhoneMobileIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ej: iPhone 15, Galaxy S23, ThinkPad X1"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
        </div>

        {/* Selección de marca */}
        <div>
          <Label>Marca</Label>
          <Select
            value={formData.marcaId || ""}
            onChange={(e) => handleChange("marcaId", Number(e.target.value))}
            disabled={loadingMarcas}
            className="bg-white dark:bg-gray-800 text-black dark:text-white"
          >
            <option value="">Seleccione una marca</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.nombre}
              </option>
            ))}
          </Select>
          {errors.marcaId && <p className="text-sm text-red-500 mt-1">{errors.marcaId}</p>}
        </div>

        {/* Botón */}
        <div>
          <Button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2"
            disabled={loading || loadingMarcas}
          >
            {loading ? "Registrando..." : "Registrar Modelo"}
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}