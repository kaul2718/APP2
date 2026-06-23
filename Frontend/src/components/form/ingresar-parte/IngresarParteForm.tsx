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
import {
    CogIcon,
    TagIcon,
    CurrencyDollarIcon,
    CheckIcon,
    MagnifyingGlassIcon,
    ArchiveBoxIcon,
    MapPinIcon,
    CalculatorIcon,
    ScaleIcon,
    ChevronUpDownIcon
} from "@heroicons/react/24/outline";
import { useMarcas } from "@/hooks/useMarcas";
import { useCategoria } from "@/hooks/useCategoria";

interface FormData {
    nombre: string;
    modelo: string;
    descripcion: string;
    codigoInterno: string;
    costo: number;
    precio1: number;
    precio2: number;
    precio3: number;
    precio4: number;
    ivaTarifa: number;
    stock: number;
    stockMinimo: number;
    ubicacion: string;
    unidadMedida: string;
    permiteModificarPrecio: boolean;
    permiteFraccionar: boolean;
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
    const { marcas, fetchMarcas } = useMarcas(false);
    const { categorias, fetchCategorias } = useCategoria(false);

    const [categoriaSearch, setCategoriaSearch] = React.useState("");
    const [marcaSearch, setMarcaSearch] = React.useState("");
    const [activeTab, setActiveTab] = React.useState<"general" | "financiero" | "logistica">("general");

    const [formData, setFormData] = React.useState<FormData>({
        nombre: "",
        modelo: "",
        descripcion: "",
        codigoInterno: "",
        costo: 0,
        precio1: 0,
        precio2: 0,
        precio3: 0,
        precio4: 0,
        ivaTarifa: 15, // Default common VAT
        stock: 0,
        stockMinimo: 1,
        ubicacion: "",
        unidadMedida: "Unidad",
        permiteModificarPrecio: false,
        permiteFraccionar: false,
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

    const handleChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateFields = () => {
        const newErrors: FormErrors = {};

        if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
        if (!formData.categoriaId) newErrors.categoriaId = "Seleccione una categoría";
        
        // Brand is only required for non-service items
        if (formData.unidadMedida !== "Servicio" && !formData.marcaId) {
            newErrors.marcaId = "Seleccione una marca";
        }

        if (formData.costo < 0) newErrors.costo = "El costo no puede ser negativo";
        if (formData.precio1 < formData.costo) newErrors.precio1 = "El PVP no debe ser menor al costo";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.warning("Complete los campos obligatorios ⚠️");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateFields()) return;

        setLoading(true);
        try {
            const finalData = { ...formData };
            if (!finalData.permiteFraccionar) {
                finalData.stock = Math.floor(finalData.stock);
                finalData.stockMinimo = Math.floor(finalData.stockMinimo);
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify(finalData),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error al registrar el producto");
                return;
            }

            toast.success("Producto registrado exitosamente ✅");
            if (embeddedMode) {
                onSuccess?.();
            } else {
                router.push('/items');
            }
        } catch (error) {
            toast.error("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    const filteredCategorias = categoriaSearch === "" ? categorias.filter(c => c.estado) : categorias.filter(c => c.estado && c.nombre.toLowerCase().includes(categoriaSearch.toLowerCase()));
    const filteredMarcas = marcaSearch === "" ? marcas.filter(m => m.estado) : marcas.filter(m => m.estado && m.nombre.toLowerCase().includes(marcaSearch.toLowerCase()));

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Premium Tab Navigation */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar gap-2">
                {["general", "financiero", "logistica"].map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                                ? 'border-b-2 border-brand-500 text-brand-800 dark:text-brand-400 bg-brand-50/30 dark:bg-brand-900/10'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="min-h-[420px]">
                {/* TAB: GENERAL */}
                {activeTab === "general" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        <div className="md:col-span-2 bg-brand-50/50 dark:bg-brand-900/10 p-6 rounded-[2rem] border border-brand-100 dark:border-brand-900/30 mb-2">
                             <p className="text-brand-600 dark:text-brand-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ScaleIcon className="w-4 h-4" />
                                Tipo de Item / Unidad de Medida *
                             </p>
                             <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {["Unidad", "Metro", "Litro", "Kilo", "Servicio"].map((u) => (
                                    <button
                                        key={u}
                                        type="button"
                                        onClick={() => {
                                            if (u === "Servicio") {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    unidadMedida: u,
                                                    stock: 0,
                                                    stockMinimo: 0,
                                                    permiteFraccionar: false,
                                                    ubicacion: "",
                                                    modelo: "",
                                                    marcaId: null
                                                }));
                                            } else {
                                                handleChange("unidadMedida", u);
                                            }
                                        }}
                                        className={`py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-tighter transition-all border shadow-sm ${
                                            formData.unidadMedida === u 
                                            ? 'bg-brand-500 border-brand-500 text-white shadow-brand-500/20 scale-105' 
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-brand-300 dark:hover:border-brand-500'
                                        }`}
                                    >
                                        {u}
                                    </button>
                                ))}
                             </div>
                        </div>

                        <div className={formData.unidadMedida === "Servicio" ? "md:col-span-2" : ""}>
                            <Label htmlFor="nombreItem" className="text-gray-700 dark:text-gray-300 font-bold mb-2">Nombre Comercial {formData.unidadMedida === "Servicio" ? "del Servicio" : "del Producto"} *</Label>
                            <div className="relative">
                                <ArchiveBoxIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                                <Input
                                    id="nombreItem"
                                    value={formData.nombre}
                                    onChange={(e) => handleChange("nombre", e.target.value)}
                                    className="pl-10 font-bold text-gray-900 dark:text-white py-3 shadow-sm"
                                    placeholder={formData.unidadMedida === "Servicio" ? "Ej: Mano de Obra Técnica - Cambio de Pantalla" : "Ej: Memoria RAM DDR4 16GB Fury Beast"}
                                />
                            </div>
                            {errors.nombre && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{errors.nombre}</p>}
                        </div>

                        {formData.unidadMedida !== "Servicio" && (
                            <>
                                <div>
                                    <Label htmlFor="modeloItem" className="text-gray-600 dark:text-gray-400 font-bold">Modelo / Referencia</Label>
                                    <Input id="modeloItem" value={formData.modelo} onChange={(e) => handleChange("modelo", e.target.value)} placeholder="Ej: KF432C16BB/16" className="bg-gray-50/50 dark:bg-gray-800/30" />
                                </div>

                                <div>
                                    <Label htmlFor="marcaItem" className="text-gray-600 dark:text-gray-400 font-bold">
                                        {formData.unidadMedida === "Servicio" ? "Marca (Referencial)" : "Marca *"}
                                    </Label>
                                    <Combobox value={formData.marcaId} onChange={(val) => handleChange("marcaId", val)}>
                                        <div className="relative">
                                            <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left border border-gray-300 dark:border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                                <Combobox.Input
                                                    id="marcaItem"
                                                    className="w-full border-none py-3 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-white bg-transparent outline-none font-medium"
                                                    displayValue={(id: number) => marcas.find(m => m.id === id)?.nombre || ""}
                                                    onChange={(e) => setMarcaSearch(e.target.value)}
                                                    placeholder="Seleccionar marca..."
                                                />
                                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </Combobox.Button>
                                            </div>
                                            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 dark:border-gray-700">
                                                {filteredMarcas.map(m => (
                                                    <Combobox.Option key={m.id} value={m.id} className={({ active }) => `relative cursor-default select-none py-3 pl-10 pr-4 text-sm ${active ? 'bg-brand-600 text-white' : 'text-gray-900 dark:text-gray-300'}`}>
                                                        {({ selected, active }) => (
                                                            <>
                                                                <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>{m.nombre}</span>
                                                                {selected && (
                                                                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-brand-600'}`}>
                                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </Combobox.Option>
                                                ))}
                                            </Combobox.Options>
                                        </div>
                                    </Combobox>
                                    {errors.marcaId && <p className="text-xs font-bold text-red-500 mt-1 uppercase tracking-wider">{errors.marcaId}</p>}
                                </div>
                            </>
                        )}

                        <div>
                            <Label htmlFor="codigoItem" className="text-gray-600 dark:text-gray-400 font-bold">Código Interno / SKU</Label>
                            <Input id="codigoItem" value={formData.codigoInterno} onChange={(e) => handleChange("codigoInterno", e.target.value)} placeholder="Ej: MEM-KIN-001" className="bg-gray-50/50 dark:bg-gray-800/30" />
                        </div>

                        <div>
                            <Label htmlFor="categoriaItem" className="text-gray-600 dark:text-gray-400 font-bold">Categoría *</Label>
                            <Combobox value={formData.categoriaId} onChange={(val) => handleChange("categoriaId", val)}>
                                <div className="relative">
                                    <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left border border-gray-300 dark:border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                        <Combobox.Input
                                            id="categoriaItem"
                                            className="w-full border-none py-3 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-white bg-transparent outline-none font-medium"
                                            displayValue={(id: number) => categorias.find(c => c.id === id)?.nombre || ""}
                                            onChange={(e) => setCategoriaSearch(e.target.value)}
                                            placeholder="Seleccionar categoría..."
                                        />
                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </Combobox.Button>
                                    </div>
                                    <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 dark:border-gray-700">
                                        {filteredCategorias.map(c => (
                                            <Combobox.Option key={c.id} value={c.id} className={({ active }) => `relative cursor-default select-none py-3 pl-10 pr-4 text-sm ${active ? 'bg-brand-600 text-white' : 'text-gray-900 dark:text-gray-300'}`}>
                                                {({ selected, active }) => (
                                                    <>
                                                        <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>{c.nombre}</span>
                                                        {selected && (
                                                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-brand-600'}`}>
                                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))}
                                    </Combobox.Options>
                                </div>
                            </Combobox>
                            {errors.categoriaId && <p className="text-xs font-bold text-red-500 mt-1 uppercase tracking-wider">{errors.categoriaId}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="descripcionItem" className="text-gray-600 dark:text-gray-400 font-bold">Descripción {formData.unidadMedida === "Servicio" ? "del Servicio" : "/ Notas Técnicas"}</Label>
                            <textarea
                                id="descripcionItem"
                                className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
                                rows={3}
                                value={formData.descripcion}
                                onChange={(e) => handleChange("descripcion", e.target.value)}
                                placeholder={formData.unidadMedida === "Servicio" ? "Ej: Incluye limpieza de contactos, diagnóstico de hardware y reporte técnico." : "Detalles sobre garantía, compatibilidad, etc."}
                            />
                        </div>
                    </div>
                )}

                {/* TAB: FINANCIERO */}
                {activeTab === "financiero" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                        <div className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800/50 space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                                    <CalculatorIcon className="w-5 h-5 text-brand-600" />
                                </div>
                                <h3 className="font-black text-xs uppercase tracking-widest text-gray-700 dark:text-gray-300">
                                    {formData.unidadMedida === "Servicio" ? "Costos y Tributos" : "Costo y Tributos"}
                                </h3>
                            </div>
                            <div>
                                <Label htmlFor="costoItem" className="text-xs font-black uppercase text-gray-500 dark:text-gray-400 mb-1">
                                    {formData.unidadMedida === "Servicio" ? "Costo Referencial de Realización" : "Costo Unitario de Adquisición"}
                                </Label>
                                <div className="relative">
                                    <CurrencyDollarIcon className="w-6 h-6 text-green-500 dark:text-green-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                                    <Input id="costoItem" type="number" step={0.01} value={formData.costo} onChange={(e) => handleChange("costo", parseFloat(e.target.value) || 0)} className="pl-12 font-black text-2xl text-gray-900 dark:text-white py-4 rounded-2xl shadow-inner bg-white dark:bg-gray-900" />
                                </div>
                                {errors.costo && <p className="text-xs font-bold text-red-500 mt-1 uppercase">{errors.costo}</p>}
                                {formData.unidadMedida === "Servicio" && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Opcional: Lo que te cuesta realizar este servicio.</p>}
                            </div>
                            <div>
                                <Label htmlFor="ivaTarifaItem" className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Tarifa IVA (%)</Label>
                                <select
                                    id="ivaTarifaItem"
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                                    value={formData.ivaTarifa}
                                    onChange={(e) => handleChange("ivaTarifa", parseInt(e.target.value))}
                                >
                                    <option value={0}>0%</option>
                                    <option value={5}>5%</option>
                                    <option value={8}>8%</option>
                                    <option value={15}>15%</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mt-4">
                                <input
                                    type="checkbox"
                                    id="modPrice"
                                    checked={formData.permiteModificarPrecio}
                                    onChange={(e) => handleChange("permiteModificarPrecio", e.target.checked)}
                                    className="w-5 h-5 text-brand-600 rounded-lg cursor-pointer transition-all"
                                />
                                <label htmlFor="modPrice" className="text-xs font-bold text-gray-600 dark:text-gray-400 cursor-pointer">
                                    {formData.unidadMedida === "Servicio" ? "Permitir ajustar precio final del servicio" : "Habilitar cambio manual de precio en caja"}
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                                    <TagIcon className="w-5 h-5 text-brand-600" />
                                </div>
                                <h3 className="font-black text-xs uppercase tracking-widest text-gray-700 dark:text-gray-300">
                                    {formData.unidadMedida === "Servicio" ? "Valor de Venta" : "Escala de Precios"}
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 gap-5">
                                <div className="p-5 bg-brand-50/50 dark:bg-brand-900/10 rounded-[2.5rem] border border-brand-100 dark:border-brand-900/30 shadow-lg shadow-brand-500/5">
                                    <Label htmlFor="precio1Item" className="text-brand-700 dark:text-brand-400 font-black text-xs uppercase mb-1">
                                        {formData.unidadMedida === "Servicio" ? "Precio del Servicio (PVP) *" : "Precio 1 - PVP (Público) *"}
                                    </Label>
                                    <Input id="precio1Item" type="number" step={0.01} value={formData.precio1} onChange={(e) => handleChange("precio1", parseFloat(e.target.value) || 0)} className="border-brand-300 dark:border-brand-800 font-black text-3xl text-brand-700 dark:text-brand-300 bg-white/80 dark:bg-gray-900/80 py-6 rounded-3xl" />
                                    {errors.precio1 && <p className="text-xs font-black text-red-500 mt-2 uppercase tracking-tight">{errors.precio1}</p>}
                                </div>
                                
                                {formData.unidadMedida !== "Servicio" && (
                                    <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                        <div className="bg-white dark:bg-gray-800/40 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <Label htmlFor="precio2Item" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">P2 - Mayorista</Label>
                                            <Input id="precio2Item" type="number" step={0.01} value={formData.precio2} onChange={(e) => handleChange("precio2", parseFloat(e.target.value) || 0)} className="border-none p-0 h-auto font-black text-xl bg-transparent focus:ring-0" />
                                        </div>
                                        <div className="bg-white dark:bg-gray-800/40 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <Label htmlFor="precio3Item" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">P3 - Especial</Label>
                                            <Input id="precio3Item" type="number" step={0.01} value={formData.precio3} onChange={(e) => handleChange("precio3", parseFloat(e.target.value) || 0)} className="border-none p-0 h-auto font-black text-xl bg-transparent focus:ring-0" />
                                        </div>
                                        <div className="col-span-2 bg-white dark:bg-gray-800/40 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <Label htmlFor="precio4Item" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">P4 - Distribución / Remate</Label>
                                            <Input id="precio4Item" type="number" step={0.01} value={formData.precio4} onChange={(e) => handleChange("precio4", parseFloat(e.target.value) || 0)} className="border-none p-0 h-auto font-black text-xl bg-transparent focus:ring-0" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: LOGISTICA */}
                {activeTab === "logistica" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fadeIn">
                        <div className="space-y-6">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <ScaleIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="font-black text-xs uppercase tracking-widest text-gray-700 dark:text-gray-300">Medición Seleccionada</h3>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-500">Unidad de Medida:</span>
                                <span className="px-4 py-1 bg-brand-500 text-white rounded-full text-xs font-black uppercase tracking-widest">{formData.unidadMedida}</span>
                            </div>
                            {formData.unidadMedida !== "Servicio" && (
                                <div className="flex items-center gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 animate-fadeIn">
                                    <input
                                        type="checkbox"
                                        id="frac"
                                        checked={formData.permiteFraccionar}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setFormData(prev => ({
                                                ...prev,
                                                permiteFraccionar: isChecked,
                                                stock: isChecked ? (prev.stock ?? 0) : Math.floor(prev.stock ?? 0),
                                                stockMinimo: isChecked ? (prev.stockMinimo ?? 0) : Math.floor(prev.stockMinimo ?? 0)
                                            }));
                                        }}
                                        className="w-6 h-6 text-brand-600 rounded-lg cursor-pointer"
                                    />
                                    <div>
                                        <label htmlFor="frac" className="text-xs font-black text-blue-900 dark:text-blue-200 cursor-pointer block uppercase tracking-wide">Venta Fraccionada</label>
                                        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Permite ingresar cantidades con decimales</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/40 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800/50 space-y-6">
                            {formData.unidadMedida === "Servicio" ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                                    <div className="p-4 bg-brand-500/10 rounded-full mb-4">
                                        <CogIcon className="w-12 h-12 text-brand-500 animate-spin-slow" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Item tipo Servicio</h4>
                                    <p className="text-xs text-gray-500 max-w-[280px]">
                                        Los servicios y mano de obra no requieren control de stock físico ni ubicación en percha.
                                    </p>
                                </div>
                            ) : (
                                <div className="animate-fadeIn space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                                            <MapPinIcon className="w-5 h-5 text-brand-600" />
                                        </div>
                                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-700 dark:text-gray-300">Inventario Inicial</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                                            <Label htmlFor="stockItem" className="text-xs font-black uppercase text-gray-500 dark:text-gray-400 mb-1">Stock Actual</Label>
                                            <Input 
                                                id="stockItem"
                                                type="number" 
                                                step={formData.permiteFraccionar ? 0.001 : 1} 
                                                value={formData.stock} 
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    handleChange("stock", formData.permiteFraccionar ? val : Math.floor(val));
                                                }} 
                                                className="border-none p-0 h-auto font-black text-3xl focus:ring-0" 
                                            />
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                                            <Label htmlFor="stockMinimoItem" className="text-xs font-black uppercase text-red-500 mb-1">Alerta Mínima</Label>
                                            <Input 
                                                id="stockMinimoItem"
                                                type="number" 
                                                step={formData.permiteFraccionar ? 0.001 : 1}
                                                value={formData.stockMinimo} 
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    handleChange("stockMinimo", formData.permiteFraccionar ? val : Math.floor(val));
                                                }} 
                                                className="border-none p-0 h-auto font-black text-3xl text-red-600 focus:ring-0" 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="ubicacionItem" className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Ubicación Física en Almacén</Label>
                                        <div className="relative">
                                            <MapPinIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <Input id="ubicacionItem" value={formData.ubicacion} onChange={(e) => handleChange("ubicacion", e.target.value)} placeholder="Ej: Sección B - Percha 4" className="pl-10 rounded-2xl py-3" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
                <Button
                    type="submit"
                    className="px-12 py-4 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                    disabled={loading}
                >
                    {loading ? "Registrando..." : "Confirmar Alta de Producto"}
                </Button>
            </div>
        </form>
    );

    if (embeddedMode) return formContent;

    return (
        <ComponentCard title="Registro Maestro de Artículos (Almacén Pro)">
            <div className="max-w-5xl mx-auto">
                {formContent}
            </div>
        </ComponentCard>
    );
}