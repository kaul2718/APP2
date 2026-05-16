"use client";
import React, { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { 
    DocumentTextIcon, 
    ListBulletIcon, 
    ArchiveBoxIcon,
    PlusCircleIcon,
    BeakerIcon
} from "@heroicons/react/24/outline";
import { useAlmacen } from "@/hooks/useAlmacen";
import { useTipoEspecificacion } from "@/hooks/useTipoEspecificacion";
 
interface FormData {
  valor: string;
  parteId: number | null;
  tipoEspecificacionId: number | null;
}
 
export default function IngresarEspecificacionParteForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items: partes, loading: loadingPartes, fetchItems } = useAlmacen();
  const { tipos, loading: loadingTipos } = useTipoEspecificacion();
  
  const [formData, setFormData] = useState<FormData>({
    valor: "",
    parteId: null,
    tipoEspecificacionId: null
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
 
  useEffect(() => {
    if (session?.accessToken) {
      void fetchItems(1, 1000, "", false);
    }
  }, [session?.accessToken]);
 
  const handleTextChange = (field: "valor", value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleIdChange = (field: "parteId" | "tipoEspecificacionId", value: number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };
 
  const validateFields = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.valor.trim()) newErrors.valor = "El valor es obligatorio";
    if (!formData.parteId) newErrors.parteId = "Seleccione un producto";
    if (!formData.tipoEspecificacionId) newErrors.tipoEspecificacionId = "Seleccione un tipo";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;
    setLoading(true);
 
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/especificaciones-parte`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken || ""}`,
        },
        body: JSON.stringify(formData),
      });
 
      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Error al registrar");
      }
 
      toast.success("Especificación técnica vinculada correctamente ✅");
      router.push('/items'); // Redirect to items to see result or specialized view
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <ComponentCard title="Configuración de Atributos Técnicos (Ficha Pro)">
      <div className="max-w-4xl mx-auto py-4">
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-brand-50/30 dark:bg-brand-900/10 p-6 rounded-[2rem] border border-brand-100 dark:border-brand-900/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-500 rounded-xl shadow-lg shadow-brand-500/20">
                        <BeakerIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-200">Definición de Atributo</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Asigne características específicas a sus productos</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <Label className="font-bold text-gray-700 dark:text-gray-300">Valor de la Especificación *</Label>
                        <div className="relative">
                            <DocumentTextIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                            <Input
                                value={formData.valor}
                                onChange={(e) => handleTextChange("valor", e.target.value)}
                                placeholder="Ej: 3200MHz CL16 / 80 Plus Platinum / 12GB GDDR6X"
                                className="pl-10 font-bold py-3.5 rounded-2xl shadow-sm"
                            />
                        </div>
                        {errors.valor && <p className="text-[10px] font-black text-red-500 mt-1 uppercase px-1">{errors.valor}</p>}
                    </div>
                </div>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Label className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-gray-500">
                        <ArchiveBoxIcon className="w-4 h-4" />
                        Producto Destino
                    </Label>
                    <div className="relative group">
                        <select
                            value={formData.parteId ?? ""}
                            onChange={(e) => handleIdChange("parteId", e.target.value ? Number(e.target.value) : null)}
                            disabled={loadingPartes}
                            className="w-full pl-4 pr-10 py-4 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 appearance-none shadow-sm transition-all group-hover:border-brand-300"
                        >
                            <option value="">Seleccionar del Almacén...</option>
                            {partes.map((p) => (
                                <option key={p.id} value={p.id}>{p.nombre} {p.modelo ? `(${p.modelo})` : ''}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <PlusCircleIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    {errors.parteId && <p className="text-[10px] font-black text-red-500 mt-1 uppercase px-1">{errors.parteId}</p>}
                </div>
 
                <div className="space-y-4">
                    <Label className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-gray-500">
                        <ListBulletIcon className="w-4 h-4" />
                        Tipo de Propiedad
                    </Label>
                    <div className="relative group">
                        <select
                            value={formData.tipoEspecificacionId ?? ""}
                            onChange={(e) => handleIdChange("tipoEspecificacionId", e.target.value ? Number(e.target.value) : null)}
                            disabled={loadingTipos}
                            className="w-full pl-4 pr-10 py-4 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 appearance-none shadow-sm transition-all group-hover:border-brand-300"
                        >
                            <option value="">Seleccionar Atributo...</option>
                            {tipos.map((t) => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <PlusCircleIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    {errors.tipoEspecificacionId && <p className="text-[10px] font-black text-red-500 mt-1 uppercase px-1">{errors.tipoEspecificacionId}</p>}
                </div>
            </div>
 
            <div className="pt-6">
                <Button 
                    type="submit" 
                    disabled={loading || loadingPartes} 
                    className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-500/20 hover:scale-[1.01] active:scale-95 transition-all"
                >
                    {loading ? "Sincronizando..." : "Vincular a Ficha Técnica"}
                </Button>
            </div>
        </form>
      </div>
    </ComponentCard>
  );
}