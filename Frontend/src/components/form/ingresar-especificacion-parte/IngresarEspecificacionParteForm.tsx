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
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { usePartes } from "@/hooks/usePartes";
import { useTipoEspecificacion } from "@/hooks/useTipoEspecificacion";

interface FormData {
  valor: string;
  parteId: number | null;
  tipoEspecificacionId: number | null;
}

export default function IngresarEspecificacionParteForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { partes, loading: loadingPartes } = usePartes();
  const { tipos, loading: loadingTipos } = useTipoEspecificacion();
  const [formData, setFormData] = React.useState<FormData>({
    valor: "",
    parteId: null,
    tipoEspecificacionId: null
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

    if (!formData.valor.trim()) {
      newErrors.valor = "El valor de la especificación es requerido";
    } else if (formData.valor.trim().length < 2) {
      newErrors.valor = "El valor debe tener al menos 2 caracteres";
    }

    if (!formData.parteId) {
      newErrors.parteId = "Debe seleccionar una parte";
    }

    if (!formData.tipoEspecificacionId) {
      newErrors.tipoEspecificacionId = "Debe seleccionar un tipo de especificación";
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/especificaciones-parte`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken || ""}`,
        },
        body: JSON.stringify({
          valor: formData.valor,
          parteId: formData.parteId,
          tipoEspecificacionId: formData.tipoEspecificacionId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error:", errorData);
        toast.error(errorData.message || "Error al registrar especificación");
        return;
      }

      toast.success("Especificación registrada con éxito ✅");

      setFormData({ 
        valor: "", 
        parteId: null, 
        tipoEspecificacionId: null 
      });

      setTimeout(() => {
        router.push('/ver-especificacion-parte');
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error("Error en la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title="Registrar Nueva Especificación de Parte">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        {/* Valor de la especificación */}
        <div>
          <Label>Valor de la Especificación</Label>
          <div className="relative">
            <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={formData.valor}
              onChange={(e) => handleChange("valor", e.target.value)}
              placeholder="Ej: 16GB, 1TB, 4.5GHz, Acero inoxidable"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.valor && <p className="text-sm text-red-500 mt-1">{errors.valor}</p>}
        </div>

        {/* Selección de parte */}
        <div>
          <Label>Parte</Label>
          <Select
            value={formData.parteId || ""}
            onChange={(e) => handleChange("parteId", Number(e.target.value))}
            disabled={loadingPartes}
            className="bg-white dark:bg-gray-800 text-black dark:text-white"
          >
            <option value="">Seleccione una parte</option>
            {partes.map((parte) => (
              <option key={parte.id} value={parte.id}>
                {parte.modelo}
              </option>
            ))}
          </Select>
          {errors.parteId && <p className="text-sm text-red-500 mt-1">{errors.parteId}</p>}
        </div>

        {/* Selección de tipo de especificación */}
        <div>
          <Label>Tipo de Especificación</Label>
          <Select
            value={formData.tipoEspecificacionId || ""}
            onChange={(e) => handleChange("tipoEspecificacionId", Number(e.target.value))}
            disabled={loadingTipos}
            className="bg-white dark:bg-gray-800 text-black dark:text-white"
          >
            <option value="">Seleccione un tipo</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>
          {errors.tipoEspecificacionId && <p className="text-sm text-red-500 mt-1">{errors.tipoEspecificacionId}</p>}
        </div>

        {/* Botón */}
        <div>
          <Button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2"
            disabled={loading || loadingPartes || loadingTipos}
          >
            {loading ? "Registrando..." : "Registrar Especificación"}
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}