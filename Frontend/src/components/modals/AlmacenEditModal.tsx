"use client";

import React, { useState, useEffect } from "react";
import CrudModal from "@/components/modals/CrudModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useMarcas } from "@/hooks/useMarcas";
import { useCategoria } from "@/hooks/useCategoria";
import { ItemAlmacen } from "@/hooks/useAlmacen";
import { Combobox } from '@headlessui/react';
import {
    ArchiveBoxIcon,
    CalculatorIcon,
    CurrencyDollarIcon,
    MapPinIcon,
    ScaleIcon,
    TagIcon,
    CheckIcon,
    ChevronUpDownIcon
} from "@heroicons/react/24/outline";
import CogIcon from "@heroicons/react/24/solid/CogIcon";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    parte: ItemAlmacen | null;
    onSave: (updatedItem: ItemAlmacen) => void;
}

interface FormState extends Partial<ItemAlmacen> {
    categoriaId?: number;
    marcaId?: number;
}

export default function AlmacenEditModal({ isOpen, onClose, parte, onSave }: Props) {
    const { data: session } = useSession();
    const { marcas, fetchMarcas } = useMarcas(false);
    const { categorias, fetchCategorias } = useCategoria(false);

    const [editando, setEditando] = useState<FormState | null>(null);
    const [cargando, setCargando] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "financiero" | "logistica">("general");

    const [categoriaSearch, setCategoriaSearch] = useState("");
    const [marcaSearch, setMarcaSearch] = useState("");

    useEffect(() => {
        if (isOpen && parte) {
            void fetchCategorias(1, 1000, "", false);
            void fetchMarcas(1, 1000, "", false);
            setEditando({
                ...parte,
                costo: Number(parte.costo) || 0,
                precio1: Number(parte.precio1) || 0,
                precio2: Number(parte.precio2) || 0,
                precio3: Number(parte.precio3) || 0,
                precio4: Number(parte.precio4) || 0,
                ivaTarifa: Number(parte.ivaTarifa) || 0,
                stock: Number(parte.stock) || 0,
                stockMinimo: Number(parte.stockMinimo) || 0,
                categoriaId: parte.categoria?.id,
                marcaId: parte.marca?.id
            });
            setActiveTab("general");
        }
    }, [isOpen, parte]);

    const handleInputChange = (field: keyof FormState, value: any) => {
        setEditando(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSubmit = async () => {
        if (!editando || !session?.accessToken || !parte) return;

        setCargando(true);
        try {
            // Remove nested objects and Keep only what backend expects (IDs and values)
            const { id, categoria, marca, createdAt, updatedAt, deletedAt, ...payload } = editando;

            // Final safety check for integers
            if (!payload.permiteFraccionar) {
                payload.stock = Math.floor(payload.stock ?? 0);
                payload.stockMinimo = Math.floor(payload.stockMinimo ?? 0);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes/${parte.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error al actualizar");
            }

            onSave(data);
            toast.success("Producto actualizado correctamente ✅");
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar");
        } finally {
            setCargando(false);
        }
    };

    if (!editando) return null;

    const filteredCategorias = categoriaSearch === ""
        ? categorias.filter(c => c.estado)
        : categorias.filter(c => c.estado && c.nombre.toLowerCase().includes(categoriaSearch.toLowerCase()));

    const filteredMarcas = marcaSearch === ""
        ? marcas.filter(m => m.estado)
        : marcas.filter(m => m.estado && m.nombre.toLowerCase().includes(marcaSearch.toLowerCase()));

    return (
        <CrudModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Editar Producto: ${parte?.nombre}`}
            onSubmit={handleSubmit}
            loading={cargando}
            mode="edit"
            maxWidth="max-w-4xl"
        >
            <div className="p-4 lg:p-6">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto no-scrollbar">
                    {["general", "financiero", "logistica"].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                                ? 'border-b-2 border-brand-500 text-brand-800 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/10'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="min-h-[450px] custom-scrollbar overflow-y-auto pr-2">
                    {/* TAB: GENERAL */}
                    {activeTab === "general" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
                            <div className="md:col-span-2 bg-brand-50/50 dark:bg-brand-900/10 p-5 rounded-3xl border border-brand-100 dark:border-brand-900/30 mb-1">
                                <p className="text-brand-600 dark:text-brand-400 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ScaleIcon className="w-4 h-4" />
                                    Tipo de Item / Unidad de Medida *
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {["Unidad", "Metro", "Litro", "Kilo", "Servicio"].map((u) => (
                                        <button
                                            key={u}
                                            type="button"
                                            onClick={() => {
                                                if (u === "Servicio") {
                                                    setEditando(prev => prev ? {
                                                        ...prev,
                                                        unidadMedida: u,
                                                        stock: 0,
                                                        stockMinimo: 0,
                                                        permiteFraccionar: false,
                                                        ubicacion: "",
                                                        modelo: "",
                                                        marcaId: undefined
                                                    } : null);
                                                } else {
                                                    handleInputChange("unidadMedida", u);
                                                }
                                            }}
                                            className={`py-2 px-1 rounded-xl text-xs font-bold uppercase tracking-tighter transition-all border shadow-sm ${
                                                editando.unidadMedida === u 
                                                ? 'bg-brand-500 border-brand-500 text-white shadow-brand-500/20 scale-105' 
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-brand-300 dark:hover:border-brand-500'
                                            }`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={editando.unidadMedida === "Servicio" ? "md:col-span-2" : ""}>
                                <Label htmlFor="nombreItem">Nombre {editando.unidadMedida === "Servicio" ? "del Servicio" : "del Producto"} *</Label>
                                <div className="relative">
                                    <ArchiveBoxIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                                    <Input
                                        id="nombreItem"
                                        value={editando.nombre || ""}
                                        onChange={(e) => handleInputChange("nombre", e.target.value)}
                                        className="pl-10 font-bold text-gray-900 dark:text-white"
                                        placeholder={editando.unidadMedida === "Servicio" ? "Ej: Mano de Obra Técnica - Cambio de Pantalla" : "Nombre descriptivo del item"}
                                    />
                                </div>
                            </div>

                            {editando.unidadMedida !== "Servicio" && (
                                <>
                                    <div>
                                        <Label htmlFor="modeloItem">Modelo / Referencia Técnica</Label>
                                        <Input id="modeloItem" value={editando.modelo || ""} onChange={(e) => handleInputChange("modelo", e.target.value)} placeholder="Ej: A15-RTX3060" />
                                    </div>
                                    <div>
                                        <Label htmlFor="marcaItem">Marca *</Label>
                                        <Combobox value={editando.marcaId} onChange={(id) => handleInputChange("marcaId", id)}>
                                            <div className="relative">
                                                <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left border border-gray-300 dark:border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                                    <Combobox.Input
                                                        id="marcaItem"
                                                        className="w-full border-none py-2.5 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-white bg-transparent outline-none"
                                                        displayValue={(id: number) => marcas.find(m => m.id === id)?.nombre || ""}
                                                        onChange={(e) => setMarcaSearch(e.target.value)}
                                                    />
                                                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                    </Combobox.Button>
                                                </div>
                                                <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 dark:border-gray-700">
                                                    {filteredMarcas.map(m => (
                                                        <Combobox.Option key={m.id} value={m.id} className={({ active }) => `relative cursor-default select-none py-2.5 pl-10 pr-4 text-sm ${active ? 'bg-brand-600 text-white' : 'text-gray-900 dark:text-gray-300'}`}>
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
                                    </div>
                                </>
                            )}

                            <div>
                                <Label htmlFor="codigoItem">Código Interno / SKU</Label>
                                <Input id="codigoItem" value={editando.codigoInterno || ""} onChange={(e) => handleInputChange("codigoInterno", e.target.value)} placeholder="Código para inventario" />
                            </div>

                            {/* Categoria Combobox */}
                            <div>
                                <Label htmlFor="categoriaItem">Categoría *</Label>
                                <Combobox value={editando.categoriaId} onChange={(id) => handleInputChange("categoriaId", id)}>
                                    <div className="relative">
                                        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left border border-gray-300 dark:border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                            <Combobox.Input
                                                id="categoriaItem"
                                                className="w-full border-none py-2.5 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-white bg-transparent outline-none"
                                                displayValue={(id: number) => categorias.find(c => c.id === id)?.nombre || ""}
                                                onChange={(e) => setCategoriaSearch(e.target.value)}
                                            />
                                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </Combobox.Button>
                                        </div>
                                        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 dark:border-gray-700">
                                            {filteredCategorias.length === 0 && categoriaSearch !== "" ? (
                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-400">Nada encontrado.</div>
                                            ) : (
                                                filteredCategorias.map(c => (
                                                    <Combobox.Option key={c.id} value={c.id} className={({ active }) => `relative cursor-default select-none py-2.5 pl-10 pr-4 text-sm ${active ? 'bg-brand-600 text-white' : 'text-gray-900 dark:text-gray-300'}`}>
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
                                                ))
                                            )}
                                        </Combobox.Options>
                                    </div>
                                </Combobox>
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="descripcionItem">Descripción {editando.unidadMedida === "Servicio" ? "del Servicio" : "Detallada"}</Label>
                                <textarea
                                    id="descripcionItem"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-shadow"
                                    rows={3}
                                    value={editando.descripcion || ""}
                                    onChange={(e) => handleInputChange("descripcion", e.target.value)}
                                    placeholder={editando.unidadMedida === "Servicio" ? "Ej: Incluye limpieza de contactos, diagnóstico de hardware y reporte técnico." : "Detalles adicionales del producto..."}
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB: FINANCIERO */}
                    {activeTab === "financiero" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/50 space-y-5">
                                <div className="flex items-center gap-2 mb-2 text-brand-600">
                                    <CalculatorIcon className="w-5 h-5" />
                                    <h3 className="font-black text-xs uppercase tracking-widest">
                                        {editando.unidadMedida === "Servicio" ? "Costos y Tributación" : "Costo y Tributación"}
                                    </h3>
                                </div>
                                <div>
                                    <Label htmlFor="costoItem">
                                        {editando.unidadMedida === "Servicio" ? "Costo Base de Realización" : "Costo de Compra (Referencia)"}
                                    </Label>
                                    <div className="relative">
                                        <CurrencyDollarIcon className="w-5 h-5 text-green-500 dark:text-green-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                                        <Input id="costoItem" type="number" step={0.01} value={editando.costo} onChange={(e) => handleInputChange("costo", parseFloat(e.target.value) || 0)} className="pl-10 font-black text-xl text-gray-900 dark:text-white" />
                                    </div>
                                    {editando.unidadMedida === "Servicio" && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Opcional: Lo que te cuesta realizar este servicio.</p>}
                                </div>
                                <div>
                                    <Label htmlFor="ivaTarifaItem">Tarifa IVA (%)</Label>
                                    <select
                                        id="ivaTarifaItem"
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                                        value={editando.ivaTarifa}
                                        onChange={(e) => handleInputChange("ivaTarifa", parseInt(e.target.value))}
                                    >
                                        <option value={0}>0%</option>
                                        <option value={5}>5%</option>
                                        <option value={8}>8%</option>
                                        <option value={15}>15%</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <input
                                        type="checkbox"
                                        id="modPriceEdit"
                                        checked={editando.permiteModificarPrecio}
                                        onChange={(e) => handleInputChange("permiteModificarPrecio", e.target.checked)}
                                        className="w-5 h-5 text-brand-600 rounded-lg cursor-pointer transition-all"
                                    />
                                    <label htmlFor="modPriceEdit" className="text-xs font-bold text-gray-600 dark:text-gray-400 cursor-pointer">
                                        {editando.unidadMedida === "Servicio" ? "Permitir ajustar precio final en facturación" : "Permitir modificación de precio final en facturación"}
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2 text-brand-600">
                                    <TagIcon className="w-5 h-5" />
                                    <h3 className="font-black text-xs uppercase tracking-widest">
                                        {editando.unidadMedida === "Servicio" ? "Valor de Venta" : "Niveles de Venta"}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-4 bg-brand-50/50 dark:bg-brand-900/10 rounded-3xl border border-brand-100 dark:border-brand-900/30">
                                        <Label htmlFor="precio1Item" className="text-brand-700 dark:text-brand-400 font-bold">
                                            {editando.unidadMedida === "Servicio" ? "Precio del Servicio (PVP) *" : "Precio 1 - PVP (Público) *"}
                                        </Label>
                                        <Input id="precio1Item" type="number" step={0.01} value={editando.precio1} onChange={(e) => handleInputChange("precio1", parseFloat(e.target.value) || 0)} className="border-brand-300 dark:border-brand-800 font-black text-xl text-brand-700 dark:text-brand-300 bg-white/50" />
                                    </div>
                                    
                                    {editando.unidadMedida !== "Servicio" && (
                                        <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl">
                                                <Label htmlFor="precio2Item" className="text-xs font-bold text-gray-600 dark:text-gray-400">P2 - Mayorista</Label>
                                                <Input id="precio2Item" type="number" step={0.01} value={editando.precio2} onChange={(e) => handleInputChange("precio2", parseFloat(e.target.value) || 0)} className="bg-transparent" />
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl">
                                                <Label htmlFor="precio3Item" className="text-xs font-bold text-gray-600 dark:text-gray-400">P3 - Especial</Label>
                                                <Input id="precio3Item" type="number" step={0.01} value={editando.precio3} onChange={(e) => handleInputChange("precio3", parseFloat(e.target.value) || 0)} className="bg-transparent" />
                                            </div>
                                            <div className="col-span-2 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl">
                                                <Label htmlFor="precio4Item" className="text-xs font-bold text-gray-600 dark:text-gray-400">P4 - Distribución / Remate</Label>
                                                <Input id="precio4Item" type="number" step={0.01} value={editando.precio4} onChange={(e) => handleInputChange("precio4", parseFloat(e.target.value) || 0)} className="bg-transparent" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: LOGISTICA */}
                    {activeTab === "logistica" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2 text-brand-600">
                                    <ScaleIcon className="w-5 h-5" />
                                    <h3 className="font-black text-xs uppercase tracking-widest">Configuración de Medición</h3>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm">
                                    <span className="text-sm font-bold text-gray-500">Unidad de Medida:</span>
                                    <span className="px-4 py-1 bg-brand-500 text-white rounded-full text-xs font-black uppercase tracking-widest">{editando.unidadMedida}</span>
                                </div>
                                {editando.unidadMedida !== "Servicio" && (
                                    <div className="flex items-center gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30 animate-fadeIn">
                                        <input
                                            type="checkbox"
                                            id="fracEdit"
                                            checked={editando.permiteFraccionar}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                setEditando(prev => {
                                                    if (!prev) return null;
                                                    return {
                                                        ...prev,
                                                        permiteFraccionar: isChecked,
                                                        stock: isChecked ? (prev.stock ?? 0) : Math.floor(prev.stock ?? 0),
                                                        stockMinimo: isChecked ? (prev.stockMinimo ?? 0) : Math.floor(prev.stockMinimo ?? 0)
                                                    };
                                                });
                                            }}
                                            className="w-6 h-6 text-blue-600 rounded-lg cursor-pointer"
                                        />
                                        <div>
                                            <label htmlFor="fracEdit" className="text-xs font-bold text-blue-900 dark:text-blue-200 cursor-pointer block">Habilitar Fraccionamiento</label>
                                            <span className="text-xs text-blue-700 dark:text-blue-400">Permite vender en decimales (Ej: 0.5 metros)</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/50 space-y-5">
                                {editando.unidadMedida === "Servicio" ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                                        <div className="p-4 bg-brand-500/10 rounded-full mb-4">
                                            <CogIcon className="w-12 h-12 text-brand-500 animate-spin-slow" />
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Item tipo Servicio</h4>
                                        <p className="text-xs text-gray-500 max-w-[280px]">
                                            Este item es un servicio o mano de obra. No requiere control de stock físico.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="animate-fadeIn space-y-5">
                                        <div className="flex items-center gap-2 mb-2 text-brand-600">
                                            <MapPinIcon className="w-5 h-5" />
                                            <h3 className="font-black text-xs uppercase tracking-widest">Almacenamiento Físico</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                                                <Label htmlFor="stockItem" className="text-xs uppercase font-bold text-gray-500">En Existencia</Label>
                                                <Input
                                                    id="stockItem"
                                                    type="number"
                                                    step={editando.permiteFraccionar ? 0.001 : 1}
                                                    value={editando.stock}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        handleInputChange("stock", editando.permiteFraccionar ? val : Math.floor(val));
                                                    }}
                                                    className="border-none p-0 h-auto font-black text-2xl focus:ring-0"
                                                />
                                            </div>
                                            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                                                <Label htmlFor="stockMinimoItem" className="text-xs uppercase font-bold text-red-500">Mínimo Crítico</Label>
                                                <Input
                                                    id="stockMinimoItem"
                                                    type="number"
                                                    step={editando.permiteFraccionar ? 0.001 : 1}
                                                    value={editando.stockMinimo}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        handleInputChange("stockMinimo", editando.permiteFraccionar ? val : Math.floor(val));
                                                    }}
                                                    className="border-none p-0 h-auto font-black text-2xl text-red-600 focus:ring-0"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="ubicacionItem" className="text-xs uppercase font-bold text-gray-500">Ubicación Física</Label>
                                            <Input id="ubicacionItem" value={editando.ubicacion || ""} onChange={(e) => handleInputChange("ubicacion", e.target.value)} placeholder="Pasillo A, Percha 2" className="mt-1" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CrudModal>
    );
}