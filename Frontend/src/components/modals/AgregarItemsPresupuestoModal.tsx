"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Combobox } from "@headlessui/react";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { HashtagIcon, TagIcon, CheckIcon, MagnifyingGlassIcon, ArchiveBoxIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { ItemAlmacen, useAlmacen } from "@/hooks/useAlmacen";

interface FormData {
    presupuestoId: number | string;
    parteId: number | string;
    cantidad: number | string;
    comentario?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (added: boolean) => void;
    onNext?: () => void;
    onBack?: () => void;
    presupuestoId: number;
    embeddedMode?: boolean;
    showNavigation?: boolean;
}

export default function AgregarItemsPresupuestoModal({
    isOpen,
    onClose,
    onSuccess,
    onNext,
    onBack,
    presupuestoId,
    embeddedMode = false,
    showNavigation = true
}: Props) {
    const { data: session } = useSession();
    const [partesDisponibles, setPartesDisponibles] = React.useState<ItemAlmacen[]>([]);
    const [loadingPartes, setLoadingPartes] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    const [formData, setFormData] = React.useState<FormData>({
        presupuestoId: presupuestoId,
        parteId: "",
        cantidad: 1,
        comentario: ""
    });

    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        setFormData(prev => ({ ...prev, presupuestoId }));
    }, [presupuestoId]);

    React.useEffect(() => {
        if (!isOpen || !session?.accessToken) return;

        const loadPartes = async () => {
            setLoadingPartes(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes?includeInactive=false`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    setPartesDisponibles(data.filter((p: any) => p.estado));
                }
            } catch (error) {
                toast.error('Error al cargar catálogo');
            } finally {
                setLoadingPartes(false);
            }
        };

        void loadPartes();
    }, [isOpen, session?.accessToken]);

    const filteredPartes = searchTerm === ""
        ? partesDisponibles
        : partesDisponibles.filter(p => 
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (p.codigoInterno && p.codigoInterno.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    const handleChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value } as FormData));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const formatCurrency = (value?: number) =>
        new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
        }).format(Number(value || 0));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.parteId) {
            setErrors({ parteId: "Requerido" });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                presupuestoId: Number(formData.presupuestoId),
                parteId: Number(formData.parteId),
                cantidad: Number(formData.cantidad),
                comentario: formData.comentario || undefined
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-presupuesto-item`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Error al añadir");

            toast.success('Producto añadido al presupuesto ✅');
            setFormData(prev => ({ ...prev, parteId: "", cantidad: 1, comentario: "" }));
            setSearchTerm("");
            onSuccess?.(true);
        } catch (error) {
            toast.error('Error al registrar el ítem');
        } finally {
            setLoading(false);
        }
    };

    const selectedParte = partesDisponibles.find(p => String(p.id) === String(formData.parteId));

    const content = (
        <div className="space-y-6">
            <div className="bg-brand-50 dark:bg-brand-900/10 p-4 rounded-2xl border border-brand-100 flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                    <ArchiveBoxIcon className="w-6 h-6 text-brand-500" />
                </div>
                <div>
                    <h4 className="text-xs font-black text-brand-600 uppercase tracking-widest">Presupuesto Referencia</h4>
                    <p className="text-xl font-black text-brand-950 dark:text-brand-100">#{formData.presupuestoId}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <Label>Seleccionar Ítem del Almacén *</Label>
                    <Combobox value={formData.parteId} onChange={(val) => handleChange("parteId", val)}>
                        <div className="relative">
                            <div className="relative w-full">
                                <TagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                                <Combobox.Input
                                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-brand-500 transition-all outline-none"
                                    displayValue={(val: any) => {
                                        const p = partesDisponibles.find(x => String(x.id) === String(val));
                                        return p ? `${p.nombre} (${p.codigoInterno || p.id})` : "";
                                    }}
                                    placeholder="Buscar por nombre o código..."
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 shadow-2xl ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                {filteredPartes.map((p) => (
                                    <Combobox.Option key={p.id} value={p.id} className={({ active }) => `relative cursor-default select-none py-3 pl-10 pr-4 text-sm ${active ? 'bg-brand-500 text-white' : 'text-gray-900 dark:text-gray-300'}`}>
                                        <div className="flex flex-col">
                                            <span className="font-bold">{p.nombre}</span>
                                            <span className="text-[10px] opacity-70">Stock: {p.stock} {p.unidadMedida} | PVP: {formatCurrency(p.precio1)}</span>
                                        </div>
                                    </Combobox.Option>
                                ))}
                            </Combobox.Options>
                        </div>
                    </Combobox>
                    {errors.parteId && <p className="text-xs text-red-500 mt-1">{errors.parteId}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Cantidad *</Label>
                        <div className="relative">
                            <HashtagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input type="number" min="1" value={formData.cantidad} onChange={(e) => handleChange("cantidad", e.target.value)} className="pl-10 font-bold" />
                        </div>
                    </div>
                    {selectedParte && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Subtotal</p>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(selectedParte.precio1 * Number(formData.cantidad))}</p>
                        </div>
                    )}
                </div>

                <div>
                    <Label>Observación Interna</Label>
                    <textarea
                        value={formData.comentario || ''}
                        onChange={(e) => handleChange("comentario", e.target.value)}
                        placeholder="Notas adicionales..."
                        className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                        rows={2}
                    />
                </div>

                <div className="flex justify-between items-center pt-4">
                    {showNavigation && onBack && (
                        <Button type="button" variant="outline" onClick={onBack}>Atrás</Button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <Button type="submit" disabled={loading || loadingPartes} className="px-10 shadow-lg shadow-brand-500/20">
                            {loading ? "Añadiendo..." : "Agregar Ítem"}
                        </Button>
                        {showNavigation && onNext && (
                            <Button type="button" onClick={onNext} variant="outline">Finalizar</Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );

    if (embeddedMode) return content;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Ítems en Presupuesto" className="max-w-xl">
            <div className="p-6">{content}</div>
        </Modal>
    );
}