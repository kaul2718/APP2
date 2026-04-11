"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { Combobox } from '@headlessui/react';
import { CogIcon, FolderIcon, TagIcon, CurrencyDollarIcon, CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useMarcas } from "@/hooks/useMarcas";
import { useCategoria } from "@/hooks/useCategoria";

interface FormData {
  nombre: string;
  modelo: string;
  descripcion: string;
  codigoInterno: string;
  precioReferencia: number;
  categoriaId: number | null;
  marcaId: number | null;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

interface IngresarParteFormProps {
  embeddedMode?: boolean;
  onSuccess?: () => void;
}

export default function IngresarParteForm({
  embeddedMode = false,
  onSuccess,
}: IngresarParteFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { marcas, loading: loadingMarcas, fetchMarcas } = useMarcas();
  const { categorias, loading: loadingCategorias, fetchCategorias } = useCategoria();
  const [categoriaSearch, setCategoriaSearch] = React.useState("");
  const [marcaSearch, setMarcaSearch] = React.useState("");
  const [formData, setFormData] = React.useState<FormData>({
    nombre: "",
    modelo: "",
    descripcion: "",
    codigoInterno: "",
    precioReferencia: 0,
    categoriaId: null,
    marcaId: null
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (status !== "authenticated") return;
    void fetchCategorias(1, 1000, "", false);
    void fetchMarcas(1, 1000, "", false);
  }, [status]);

  const categoriasActivas = categorias.filter((categoria) => categoria.estado);
  const marcasActivas = marcas.filter((marca) => marca.estado);

  const filteredCategorias = categoriaSearch === ""
    ? categoriasActivas
    : categoriasActivas.filter((categoria) =>
        [categoria.nombre, categoria.descripcion]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(categoriaSearch.toLowerCase()))
      );

  const filteredMarcas = marcaSearch === ""
    ? marcasActivas
    : marcasActivas.filter((marca) =>
        marca.nombre.toLowerCase().includes(marcaSearch.toLowerCase())
      );

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateFields = () => {
    const newErrors: FormErrors = {};

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

    if (formData.codigoInterno.trim() && formData.codigoInterno.trim().length < 2) {
      newErrors.codigoInterno = "El código debe tener al menos 2 caracteres";
    }

    if (formData.precioReferencia <= 0) {
      newErrors.precioReferencia = "El precio de referencia debe ser mayor a 0";
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
          nombre: formData.nombre,
          modelo: formData.modelo,
          descripcion: formData.descripcion,
          codigoInterno: formData.codigoInterno || undefined,
          precioReferencia: formData.precioReferencia,
          categoriaId: formData.categoriaId,
          marcaId: formData.marcaId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error:", errorData);
        toast.error(errorData.message || "Error al registrar el ítem");
        return;
      }

      toast.success("Ítem registrado con éxito ✅");

      setFormData({
        nombre: "",
        modelo: "",
        descripcion: "",
        codigoInterno: "",
        precioReferencia: 0,
        categoriaId: null,
        marcaId: null
      });

      if (embeddedMode) {
        onSuccess?.();
      } else {
        setTimeout(() => {
          router.push('/ver-parte');
        }, 1000);
      }

    } catch (error) {
      console.error(error);
      toast.error("Error en la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        {/* Nombre del ítem */}
        <div>
          <Label>Nombre del Ítem</Label>
          <div className="relative">
            <TagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ej: Memoria RAM DDR4, SSD Kingston 480GB"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
        </div>

        {/* Modelo / referencia */}
        <div>
          <Label>Modelo / Referencia</Label>
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

        {/* Código interno */}
        <div>
          <Label>Código Interno (opcional)</Label>
          <div className="relative">
            <TagIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              value={formData.codigoInterno}
              onChange={(e) => handleChange("codigoInterno", e.target.value)}
              placeholder="Ej: RAM-001"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.codigoInterno && <p className="text-sm text-red-500 mt-1">{errors.codigoInterno}</p>}
        </div>

        {/* Precio de referencia */}
        <div>
          <Label>Precio de Referencia</Label>
          <div className="relative">
            <CurrencyDollarIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <Input
              type="number"
              min="0"
              step={0.01}
              value={formData.precioReferencia}
              onChange={(e) => handleChange("precioReferencia", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          {errors.precioReferencia && <p className="text-sm text-red-500 mt-1">{errors.precioReferencia}</p>}
        </div>

        {/* Descripción */}
        <div>
          <Label>Descripción</Label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => handleChange("descripcion", e.target.value)}
            placeholder="Descripción detallada del ítem..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
            rows={3}
          />
          {errors.descripcion && <p className="text-sm text-red-500 mt-1">{errors.descripcion}</p>}
        </div>

        {/* Selección de categoría */}
        <div>
          <Label>Categoría</Label>
          <Combobox
            value={formData.categoriaId}
            onChange={(value: number) => {
              handleChange("categoriaId", value);
              setCategoriaSearch("");
            }}
            disabled={loadingCategorias}
          >
            <div className="relative">
              <div className="relative">
                <Combobox.Input
                  className={`w-full rounded-md border bg-white py-2 pl-10 pr-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${errors.categoriaId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  displayValue={(value: number) => categoriasActivas.find((categoria) => categoria.id === value)?.nombre || ""}
                  onChange={(event) => setCategoriaSearch(event.target.value)}
                  placeholder={loadingCategorias ? 'Cargando categorías...' : 'Escriba para buscar una categoría'}
                />
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>

              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
                {filteredCategorias.length === 0 ? (
                  <div className="px-4 py-2 text-gray-700 dark:text-gray-300">No se encontraron categorías</div>
                ) : (
                  filteredCategorias.map((categoria) => (
                    <Combobox.Option
                      key={categoria.id}
                      value={categoria.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-200'}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {categoria.nombre}
                          </span>
                          <span className={`block truncate text-xs ${selected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {categoria.descripcion}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
          {errors.categoriaId && <p className="text-sm text-red-500 mt-1">{errors.categoriaId}</p>}
        </div>

        {/* Selección de marca */}
        <div>
          <Label>Marca</Label>
          <Combobox
            value={formData.marcaId}
            onChange={(value: number) => {
              handleChange("marcaId", value);
              setMarcaSearch("");
            }}
            disabled={loadingMarcas}
          >
            <div className="relative">
              <div className="relative">
                <Combobox.Input
                  className={`w-full rounded-md border bg-white py-2 pl-10 pr-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${errors.marcaId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  displayValue={(value: number) => marcasActivas.find((marca) => marca.id === value)?.nombre || ""}
                  onChange={(event) => setMarcaSearch(event.target.value)}
                  placeholder={loadingMarcas ? 'Cargando marcas...' : 'Escriba para buscar una marca'}
                />
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>

              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
                {filteredMarcas.length === 0 ? (
                  <div className="px-4 py-2 text-gray-700 dark:text-gray-300">No se encontraron marcas</div>
                ) : (
                  filteredMarcas.map((marca) => (
                    <Combobox.Option
                      key={marca.id}
                      value={marca.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-200'}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {marca.nombre}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
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
  );

  if (embeddedMode) {
    return formContent;
  }

  return <ComponentCard title="Registrar Nuevo Ítem del Catálogo">{formContent}</ComponentCard>;
}