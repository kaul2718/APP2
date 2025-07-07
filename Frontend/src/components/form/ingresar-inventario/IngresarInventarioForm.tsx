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
import { CubeIcon, MapPinIcon, HashtagIcon, ExclamationCircleIcon, Cog8ToothIcon } from "@heroicons/react/24/outline";
import { usePartes } from "@/hooks/usePartes";
import { useInventario } from "@/hooks/useInventario";

interface FormData {
  parteId: number | null;
  cantidad: number;
  stockMinimo: number;
  ubicacion: string;
}

export default function IngresarInventarioForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { partes, loading: loadingPartes } = usePartes();
  const { createInventario } = useInventario();
  const [formData, setFormData] = React.useState<FormData>({
    parteId: null,
    cantidad: 0,
    stockMinimo: 1,
    ubicacion: ""
  });
  const [errors, setErrors] = React.useState<Partial<FormData>>({});
  const [loading, setLoading] = React.useState(false);

  const handleChange = (field: keyof FormData, value: string | number) => {
    // Convertir a número solo si el campo es cantidad o stockMinimo
    const processedValue = (field === 'cantidad' || field === 'stockMinimo')
      ? Number(value)
      : value;

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateFields = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.parteId) {
      newErrors.parteId = "Debe seleccionar una parte";
    }

    if (formData.cantidad <= 0) {
      newErrors.cantidad = "La cantidad debe ser mayor a 0";
    }

    if (formData.stockMinimo <= 0) {
      newErrors.stockMinimo = "El stock mínimo debe ser mayor a 0";
    }

    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = "La ubicación es requerida";
    } else if (formData.ubicacion.trim().length < 2) {
      newErrors.ubicacion = "La ubicación debe tener al menos 2 caracteres";
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
      await createInventario({
        parteId: formData.parteId as number,
        cantidad: formData.cantidad,
        stockMinimo: formData.stockMinimo,
        ubicacion: formData.ubicacion
      });

      toast.success("Producto registrado con éxito ✅");

      // Reset form
      setFormData({
        parteId: null,
        cantidad: 0,
        stockMinimo: 1,
        ubicacion: ""
      });

      setTimeout(() => {
        router.push('/ver-inventario');
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error al registrar inventario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title="Registrar Nuevo Inventario">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        {/* Selección de parte */}
        <div>
          <Label>Parte/Repuesto</Label>
          <div className="relative">
            {/* Puedes cambiar el ícono si prefieres otro más representativo */}
            <Cog8ToothIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Select
              value={formData.parteId ?? ""}
              onChange={(e) => handleChange("parteId", Number(e.target.value))}
              disabled={loadingPartes}
              className="pl-10 pr-4 py-2 w-full rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione una parte</option>
              {partes.map((parte) => (
                <option key={parte.id} value={parte.id}>
                  {parte.nombre} - {parte.modelo}
                </option>
              ))}
            </Select>
          </div>
          {errors.parteId && <p className="text-sm text-red-500 mt-1">{errors.parteId}</p>}
        </div>
        {/* Cantidad */}
        <div>
          <Label>Cantidad</Label>
          <div className="relative">
            <HashtagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              type="number"
              min="0"
              value={formData.cantidad}
              onChange={(e) => handleChange("cantidad", e.target.value)}
              placeholder="Ej: 10"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.cantidad && <p className="text-sm text-red-500 mt-1">{errors.cantidad}</p>}
        </div>

        {/* Stock mínimo */}
        <div>
          <Label>Stock Mínimo</Label>
          <div className="relative">
            <ExclamationCircleIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              type="number"
              min="1"
              value={formData.stockMinimo}
              onChange={(e) => handleChange("stockMinimo", e.target.value)}
              placeholder="Ej: 2"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.stockMinimo && <p className="text-sm text-red-500 mt-1">{errors.stockMinimo}</p>}
        </div>

        {/* Ubicación */}
        <div>
          <Label>Ubicación</Label>
          <div className="relative">
            <MapPinIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={formData.ubicacion}
              onChange={(e) => handleChange("ubicacion", e.target.value)}
              placeholder="Ej: Almacén A, Estante 2"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.ubicacion && <p className="text-sm text-red-500 mt-1">{errors.ubicacion}</p>}
        </div>

        {/* Botón */}
        <div>
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2"
            disabled={loading || loadingPartes}
          >
            <CubeIcon className="w-5 h-5" />
            {loading ? "Registrando..." : "Registrar Inventario"}
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}