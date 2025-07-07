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
import { CurrencyDollarIcon, UserIcon, HashtagIcon } from "@heroicons/react/24/outline";
import { useTipoManoObra } from "@/hooks/useTipoManoObra";

interface FormData {
  presupuestoId: number | string;
  tipoManoObraId: number | string;
  cantidad: number | string;
}

interface IngresarDetalleManoObraFormProps {
  presupuestoId?: number;
  onSuccess?: () => void;
}

export default function IngresarDetalleManoObraForm({ 
  presupuestoId: initialPresupuestoId,
  onSuccess 
}: IngresarDetalleManoObraFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { tipos, loading: loadingTipos } = useTipoManoObra();
  
  const [formData, setFormData] = React.useState<FormData>({
    presupuestoId: initialPresupuestoId || "",
    tipoManoObraId: "",
    cantidad: 1 // Valor por defecto según tu entidad
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

    if (!formData.presupuestoId) {
      newErrors.presupuestoId = "El presupuesto es requerido";
    }

    if (!formData.tipoManoObraId) {
      newErrors.tipoManoObraId = "El tipo de mano de obra es requerido";
    }

    if (!formData.cantidad) {
      newErrors.cantidad = "La cantidad es requerida";
    } else if (Number(formData.cantidad) <= 0) {
      newErrors.cantidad = "La cantidad debe ser mayor a 0";
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
      const payload = {
        presupuestoId: Number(formData.presupuestoId),
        tipoManoObraId: Number(formData.tipoManoObraId),
        cantidad: Number(formData.cantidad)
      };

      console.log("Enviando datos:", payload); // Para debug

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-mano-obra`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      console.log("Respuesta del servidor:", responseData); // Para debug

      if (!res.ok) {
        throw new Error(responseData.message || "Error al registrar detalle");
      }

      toast.success("Detalle de mano de obra registrado con éxito ✅");

      // Reset form (excepto presupuestoId si viene como prop)
      setFormData(prev => ({
        ...prev,
        tipoManoObraId: "",
        cantidad: 1
      }));

      // Ejecutar callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      } else if (initialPresupuestoId) {
        router.refresh(); // Recargar la página actual
      } else {
        router.push('/ver-detalle-mano-obra');
      }

    } catch (error) {
      console.error("Error completo:", error);
      toast.error(error instanceof Error ? error.message : "Error al registrar detalle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title="Agregar Mano de Obra al Presupuesto">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        {/* Presupuesto ID (solo si no viene como prop) */}
        {!initialPresupuestoId && (
          <div>
            <Label>ID del Presupuesto</Label>
            <div className="relative">
              <HashtagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <Input
                type="number"
                value={formData.presupuestoId}
                onChange={(e) => handleChange("presupuestoId", e.target.value)}
                placeholder="Ingrese el ID del presupuesto"
                className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
            </div>
            {errors.presupuestoId && <p className="text-sm text-red-500 mt-1">{errors.presupuestoId}</p>}
          </div>
        )}

        {/* Tipo de Mano de Obra */}
        <div>
          <Label>Tipo de Mano de Obra</Label>
          <div className="relative">
            <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Select
              value={formData.tipoManoObraId}
              onChange={(e) => handleChange("tipoManoObraId", e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              disabled={loadingTipos}
            >
              <option value="">Seleccione un tipo</option>
              {tipos
                .filter(tipo => tipo.estado)
                .map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre} (${tipo.costo})
                  </option>
                ))}
            </Select>
          </div>
          {errors.tipoManoObraId && <p className="text-sm text-red-500 mt-1">{errors.tipoManoObraId}</p>}
        </div>

        {/* Cantidad */}
        <div>
          <Label>Cantidad</Label>
          <div className="relative">
            <HashtagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              type="number"
              min="1"
              step={1}
              value={formData.cantidad}
              onChange={(e) => handleChange("cantidad", e.target.value)}
              placeholder="Cantidad"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.cantidad && <p className="text-sm text-red-500 mt-1">{errors.cantidad}</p>}
        </div>

        {/* Botón */}
        <div>
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2"
            disabled={loading || loadingTipos}
          >
            {loading ? "Registrando..." : "Agregar al Presupuesto"}
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}