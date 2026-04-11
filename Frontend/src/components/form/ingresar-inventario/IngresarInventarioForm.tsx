"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Combobox } from "@headlessui/react";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { CubeIcon, MapPinIcon, HashtagIcon, ExclamationCircleIcon, CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Parte, usePartes } from "@/hooks/usePartes";
import { useInventario } from "@/hooks/useInventario";

interface FormData {
  parteId: number | null;
  cantidad: number;
  stockMinimo: number;
  ubicacion: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

interface IngresarInventarioFormProps {
  embeddedMode?: boolean;
  onSuccess?: () => void;
}

export default function IngresarInventarioForm({
  embeddedMode = false,
  onSuccess,
}: IngresarInventarioFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { fetchAllPartes, loading: loadingPartes } = usePartes();
  const { createInventario } = useInventario();
  const [partesDisponibles, setPartesDisponibles] = React.useState<Parte[]>([]);
  const [parteSearch, setParteSearch] = React.useState("");
  const [formData, setFormData] = React.useState<FormData>({
    parteId: null,
    cantidad: 0,
    stockMinimo: 1,
    ubicacion: ""
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (status !== "authenticated") return;

    const loadPartes = async () => {
      try {
        const data = await fetchAllPartes(false);
        setPartesDisponibles(data.filter((parte) => parte.estado));
      } catch (error) {
        console.error("Error cargando partes para inventario:", error);
      }
    };

    void loadPartes();
  }, [status]);

  const filteredPartes = parteSearch === ""
    ? partesDisponibles
    : partesDisponibles.filter((parte) =>
        [
          parte.nombre,
          parte.modelo,
          parte.codigoInterno,
          parte.categoria?.nombre,
          parte.marca?.nombre,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(parteSearch.toLowerCase()))
      );

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
    const newErrors: FormErrors = {};

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

      if (embeddedMode) {
        onSuccess?.();
      } else {
        setTimeout(() => {
          router.push('/ver-inventario');
        }, 1000);
      }

    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error al registrar inventario");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 overflow-visible">
        {/* Selección de parte */}
        <div className="relative z-30">
          <Label>Parte / Ítem</Label>
          <Combobox
            value={formData.parteId}
            onChange={(value: number) => {
              handleChange("parteId", value);
              setParteSearch("");
            }}
            disabled={loadingPartes}
          >
            <div className="relative overflow-visible">
              <div className="relative z-10">
                <Combobox.Input
                  className={`w-full rounded-md border bg-white py-2 pl-10 pr-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${errors.parteId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  displayValue={(value: number) => {
                    const parte = partesDisponibles.find((item) => item.id === value);
                    if (!parte) return "";
                    return `${parte.nombre} - ${parte.codigoInterno || parte.modelo || 'Sin referencia'}`;
                  }}
                  onChange={(event) => setParteSearch(event.target.value)}
                  placeholder={loadingPartes ? 'Cargando ítems...' : 'Escriba para buscar una parte o ítem'}
                />
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>

              <Combobox.Options className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-gray-700 dark:bg-gray-800">
                {loadingPartes ? (
                  <div className="px-4 py-2 text-gray-700 dark:text-gray-300">Cargando ítems...</div>
                ) : filteredPartes.length === 0 ? (
                  <div className="px-4 py-2 text-gray-700 dark:text-gray-300">No se encontraron ítems</div>
                ) : (
                  filteredPartes.map((parte) => (
                    <Combobox.Option
                      key={parte.id}
                      value={parte.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-200'}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {parte.nombre} - {parte.codigoInterno || parte.modelo || 'Sin referencia'}
                          </span>
                          <span className={`block truncate text-xs ${selected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {parte.marca?.nombre || 'Sin marca'} · {parte.categoria?.nombre || 'Sin categoría'}
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
          {errors.parteId && <p className="text-sm text-red-500 mt-1">{errors.parteId}</p>}
        </div>
        {/* Cantidad */}
        <div className="relative z-0">
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
        <div className="relative z-0">
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
        <div className="relative z-0">
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
  );

  if (embeddedMode) {
    return formContent;
  }

  return <ComponentCard title="Registrar Nuevo Inventario">{formContent}</ComponentCard>;
}