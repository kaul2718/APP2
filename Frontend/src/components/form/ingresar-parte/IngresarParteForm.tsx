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
import { CogIcon, FolderIcon, TagIcon } from "@heroicons/react/24/outline";
import { useMarcas } from "@/hooks/useMarcas";
import { useCategoria } from "@/hooks/useCategoria";

interface FormData {
  nombre: string; // Nuevo campo
  modelo: string;
  descripcion: string;
  categoriaId: number | null;
  marcaId: number | null;
}

export default function IngresarParteForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { marcas, loading: loadingMarcas } = useMarcas();
  const { categorias, loading: loadingCategorias } = useCategoria();
  const [formData, setFormData] = React.useState<FormData>({
    nombre: "", // Nuevo campo
    modelo: "",
    descripcion: "",
    categoriaId: null,
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
      newErrors.nombre = "El nombre de la parte es requerido";
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    if (!formData.modelo.trim()) {
      newErrors.modelo = "El modelo de la parte es requerido";
    } else if (formData.modelo.trim().length < 2) {
      newErrors.modelo = "El modelo debe tener al menos 2 caracteres";
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es requerida";
    } else if (formData.descripcion.trim().length < 5) {
      newErrors.descripcion = "La descripción debe tener al menos 5 caracteres";
    }

    if (!formData.categoriaId) {
      newErrors.categoriaId = "Debe seleccionar una categoría";
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken || ""}`,
        },
        body: JSON.stringify({
          nombre: formData.nombre, // Nuevo campo
          modelo: formData.modelo,
          descripcion: formData.descripcion,
          categoriaId: formData.categoriaId,
          marcaId: formData.marcaId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error:", errorData);
        toast.error(errorData.message || "Error al registrar parte");
        return;
      }

      toast.success("Parte registrada con éxito ✅");

      setFormData({
        nombre: "", // Nuevo campo
        modelo: "",
        descripcion: "",
        categoriaId: null,
        marcaId: null
      });

      setTimeout(() => {
        router.push('/ver-parte');
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error("Error en la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title="Registrar Nueva Parte">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        {/* Nombre de la parte */}
        <div>
          <Label>Nombre de la Parte</Label>
          <div className="relative">
            <TagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ej: Laptop, Memoria Ram, Disco Duro"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
        </div>

        {/* Modelo de la parte */}
        <div>
          <Label>Modelo de la Parte</Label>
          <div className="relative">
            <CogIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={formData.modelo}
              onChange={(e) => handleChange("modelo", e.target.value)}
              placeholder="Ej: 1234-ABC, XT-500, ProSeries 3000"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.modelo && <p className="text-sm text-red-500 mt-1">{errors.modelo}</p>}
        </div>

        {/* Descripción */}
        <div>
          <Label>Descripción</Label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => handleChange("descripcion", e.target.value)}
            placeholder="Descripción detallada de la parte..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
            rows={3}
          />
          {errors.descripcion && <p className="text-sm text-red-500 mt-1">{errors.descripcion}</p>}
        </div>

        {/* Selección de categoría */}
        <div>
          <Label>Categoría</Label>
          <div className="relative">
            <FolderIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <select
              value={formData.categoriaId ?? ""}
              onChange={(e) => handleChange("categoriaId", Number(e.target.value))}
              disabled={loadingCategorias}
              className="pl-10 pr-4 py-2 w-full rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione una categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>
          {errors.categoriaId && <p className="text-sm text-red-500 mt-1">{errors.categoriaId}</p>}
        </div>

        {/* Selección de marca */}
        <div>
          <Label>Marca</Label>
          <div className="relative">
            <TagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <select
              value={formData.marcaId ?? ""}
              onChange={(e) => handleChange("marcaId", Number(e.target.value))}
              disabled={loadingMarcas}
              className="pl-10 pr-4 py-2 w-full rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione una marca</option>
              {marcas.map((marca) => (
                <option key={marca.id} value={marca.id}>
                  {marca.nombre}
                </option>
              ))}
            </select>
          </div>
          {errors.marcaId && <p className="text-sm text-red-500 mt-1">{errors.marcaId}</p>}
        </div>


        {/* Botón */}
        <div>
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2"
            disabled={loading || loadingMarcas || loadingCategorias}
          >
            {loading ? "Registrando..." : "Registrar Parte"}
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}