"use client";
 
import React from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import { ItemAlmacen } from "@/hooks/useAlmacen";
import { 
    ArchiveBoxIcon, 
    TagIcon, 
    CurrencyDollarIcon, 
    MapPinIcon, 
    ScaleIcon,
    InformationCircleIcon,
    CalendarDaysIcon,
    IdentificationIcon,
    ShoppingBagIcon
} from "@heroicons/react/24/outline";
 
interface Props {
    isOpen: boolean;
    onClose: () => void;
    parte: ItemAlmacen | null;
}
 
export default function AlmacenDetailsModal({ isOpen, onClose, parte: item }: Props) {
    if (!item) return null;
 
    const formatCurrency = (value?: number) =>
        new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
        }).format(Number(value || 0));
 
    const DetailRow = ({ icon: Icon, label, value, colorClass = "text-gray-900 dark:text-gray-100" }: any) => (
        <div className="flex items-center justify-between py-3.5 border-b border-gray-100 dark:border-gray-800/50 last:border-0 group">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 group-hover:text-brand-500 transition-colors">
                <Icon className="w-4.5 h-4.5" />
                <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
            </div>
            <span className={`text-sm font-black ${colorClass}`}>{value}</span>
        </div>
    );
 
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ficha Técnica de Almacén"
            className="max-w-3xl"
        >
            <div className="p-0 overflow-hidden">
                {/* Header Section with Gradient Background */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="h-20 w-20 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center shadow-xl shadow-brand-500/10 border border-gray-100 dark:border-gray-700">
                            <ArchiveBoxIcon className="h-10 w-10 text-brand-500" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {item.nombre}
                                </h3>
                                <Badge variant="light" color={item.estado ? "success" : "error"} className="font-black px-3 py-1 uppercase text-xs">
                                    {item.estado ? "En Stock" : "Descontinuado"}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1.5 bg-gray-200/50 dark:bg-gray-700/50 px-2.5 py-1 rounded-lg">
                                    <IdentificationIcon className="w-4 h-4" /> SKU: {item.codigoInterno || '---'}
                                </span>
                                <span className="flex items-center gap-1.5 bg-gray-200/50 dark:bg-gray-700/50 px-2.5 py-1 rounded-lg">
                                    <ShoppingBagIcon className="w-4 h-4" /> Mod: {item.modelo || 'Genérico'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Financial Power Card */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b-2 border-brand-500 pb-2">
                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-600">
                                    <CurrencyDollarIcon className="w-5 h-5" />
                                    Métricas Comerciales
                                </h4>
                                {item.permiteModificarPrecio && (
                                    <span className="text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase">Precio Variable</span>
                                )}
                            </div>
                            <div className="bg-white dark:bg-gray-900/40 rounded-2xl space-y-0">
                                <DetailRow icon={CurrencyDollarIcon} label="Costo de Reposición" value={formatCurrency(item.costo)} colorClass="text-gray-500 font-bold" />
                                <div className="bg-brand-50/50 dark:bg-brand-900/5 px-4 rounded-2xl my-2 border border-brand-100/50 dark:border-brand-900/20">
                                    <DetailRow icon={TagIcon} label="Precio de Venta (PVP)" value={formatCurrency(item.precio1)} colorClass="text-brand-600 dark:text-brand-400 text-lg font-black" />
                                </div>
                                <DetailRow icon={TagIcon} label="Mayorista (P2)" value={formatCurrency(item.precio2)} />
                                <DetailRow icon={TagIcon} label="Especial (P3)" value={formatCurrency(item.precio3)} />
                                <DetailRow icon={TagIcon} label="Remate / Dist (P4)" value={formatCurrency(item.precio4)} />
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-between">
                                    <span className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase">Configuración de IVA</span>
                                    <span className="text-sm font-black text-gray-700 dark:text-gray-300">{item.ivaTarifa}% Aplicado</span>
                                </div>
                            </div>
                        </div>
 
                        {/* Logistics & Inventory Power Card */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b-2 border-brand-500 pb-2">
                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-600">
                                    <ScaleIcon className="w-5 h-5" />
                                    Control de Inventario
                                </h4>
                            </div>
                            <div className="bg-white dark:bg-gray-900/40 rounded-2xl">
                                <div className={`p-6 rounded-3xl mb-4 flex items-center justify-between border ${
                                    item.stock <= item.stockMinimo 
                                    ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' 
                                    : 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30'
                                }`}>
                                    <div>
                                        <p className="text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-1">Stock Disponible</p>
                                        <p className={`text-3xl font-black ${item.stock <= item.stockMinimo ? 'text-red-600' : 'text-green-600'}`}>
                                            {item.stock} <span className="text-sm font-bold opacity-70">{item.unidadMedida}</span>
                                        </p>
                                    </div>
                                    <ArchiveBoxIcon className={`w-12 h-12 opacity-20 ${item.stock <= item.stockMinimo ? 'text-red-600' : 'text-green-600'}`} />
                                </div>
                                <DetailRow icon={InformationCircleIcon} label="Mínimo Requerido" value={`${item.stockMinimo} ${item.unidadMedida}`} />
                                <DetailRow icon={MapPinIcon} label="Localización Bodega" value={item.ubicacion || "Sin ubicación asignada"} colorClass="text-gray-700 dark:text-gray-300" />
                                <DetailRow icon={TagIcon} label="Categoría" value={item.categoria?.nombre || "General"} />
                                <DetailRow icon={TagIcon} label="Marca" value={item.marca?.nombre || "Genérica"} />
                                
                                <div className="mt-4 flex items-center gap-4">
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <p className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase mb-1">Fraccionamiento</p>
                                        <p className="text-xs font-bold">{item.permiteFraccionar ? "Habilitado (Decimales)" : "Deshabilitado (Enteros)"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
 
                    {/* Description Area */}
                    <div className="mt-10 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-3">
                            <InformationCircleIcon className="w-4 h-4" />
                            Notas Adicionales y Descripción
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                            {item.descripcion || "Este producto no cuenta con especificaciones técnicas adicionales registradas en el sistema."}
                        </p>
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                            <span className="flex items-center gap-1"><CalendarDaysIcon className="w-3.5 h-3.5" /> Alta: {new Date(item.createdAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><CalendarDaysIcon className="w-3.5 h-3.5" /> Últ. Mov: {new Date(item.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}