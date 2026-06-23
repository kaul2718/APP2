"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import { Combobox } from "@headlessui/react";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { 
    HashtagIcon, 
    TagIcon, 
    CheckIcon, 
    MagnifyingGlassIcon, 
    ArchiveBoxIcon, 
    LockClosedIcon, 
    LockOpenIcon 
} from "@heroicons/react/24/outline";
import { ItemAlmacen } from "@/hooks/useAlmacen";

interface FormData {
    presupuestoId: number;
    parteId: string;
    cantidad: number;
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

    // Estados para precio personalizado y tarifas
    const [itemPrice, setItemPrice] = React.useState<string>("");
    const [activeTier, setActiveTier] = React.useState<'p1' | 'p2' | 'p3' | 'p4' | ''>('p1');

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
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleCatalogSelect = (val: string) => {
        handleChange("parteId", val);
        setActiveTier('p1');
        const item = partesDisponibles.find(p => String(p.id) === String(val));
        if (item) {
            setItemPrice(String(item.precio1 || 0));
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

        const item = partesDisponibles.find(p => String(p.id) === String(formData.parteId));
        if (!item) return;

        const qty = Number(formData.cantidad);
        const price = Number(itemPrice);

        if (isNaN(qty) || qty <= 0) {
            toast.warning("La cantidad debe ser mayor que 0");
            return;
        }
        if (isNaN(price) || price < 0) {
            toast.warning("El precio no puede ser negativo");
            return;
        }

        // Validar stock para productos
        if (item.unidadMedida !== 'Servicio') {
            if (item.stock <= 0) {
                toast.error(`El producto "${item.nombre}" no tiene stock disponible (Stock actual: 0).`);
                return;
            }

            if (qty > item.stock) {
                toast.error(`No puedes agregar ${qty} u. del producto "${item.nombre}". Solo hay ${item.stock} u. disponibles en stock.`);
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                presupuestoId: Number(formData.presupuestoId),
                parteId: Number(formData.parteId),
                cantidad: qty,
                precioUnitario: price,
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

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Error al añadir");
            }

            toast.success('Producto añadido al presupuesto ✅');
            setFormData(prev => ({ ...prev, parteId: "", cantidad: 1, comentario: "" }));
            setSearchTerm("");
            setItemPrice("");
            setActiveTier('p1');
            onSuccess?.(true);
        } catch (error: any) {
            toast.error(error.message || 'Error al registrar el ítem');
        } finally {
            setLoading(false);
        }
    };

    const selectedParte = partesDisponibles.find(p => String(p.id) === String(formData.parteId));

    const content = (
        <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                    <ArchiveBoxIcon className="w-6 h-6 text-blue-500" aria-hidden="true" />
                </div>
                <div>
                    <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Presupuesto Referencia</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">#{formData.presupuestoId}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <Label htmlFor="item-almacen" className="mb-1 block font-medium">Seleccionar Ítem del Almacén *</Label>
                    <Combobox value={formData.parteId} onChange={handleCatalogSelect}>
                        <div className="relative">
                            <div className="relative w-full">
                                <TagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" aria-hidden="true" />
                                <Combobox.Input
                                    id="item-almacen"
                                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.03] text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-900 dark:text-white"
                                    displayValue={(val: any) => {
                                        const p = partesDisponibles.find(x => String(x.id) === String(val));
                                        return p ? `${p.nombre} (${p.codigoInterno || p.id})` : "";
                                    }}
                                    placeholder="Buscar por nombre o código..."
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 shadow-2xl ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 border border-gray-150 dark:border-gray-750">
                                {filteredPartes.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-500">Ningún artículo coincide.</div>
                                ) : (
                                    filteredPartes.map((p) => (
                                        <Combobox.Option key={p.id} value={String(p.id)} className={({ active }) => `relative cursor-pointer select-none py-3 pl-10 pr-4 text-sm ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-300'}`}>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold">{p.nombre}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-widest ${
                                                        p.unidadMedida === 'Servicio' 
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                    }`}>
                                                        {p.unidadMedida === 'Servicio' ? 'Servicio' : 'Producto'}
                                                    </span>
                                                </div>
                                                <span className="text-xs opacity-70">
                                                    {p.unidadMedida === 'Servicio' 
                                                        ? `Precio: ${formatCurrency(p.precio1)}`
                                                        : `Stock: ${p.stock} ${p.unidadMedida} | PVP: ${formatCurrency(p.precio1)}`
                                                    }
                                                </span>
                                            </div>
                                        </Combobox.Option>
                                    ))
                                )}
                            </Combobox.Options>
                        </div>
                    </Combobox>
                    {errors.parteId && <p className="text-xs text-red-500 mt-1">{errors.parteId}</p>}
                </div>

                {selectedParte && selectedParte.unidadMedida !== 'Servicio' && (
                    <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-200 dark:border-gray-700 animate-fadeIn">
                        <p className="text-xs uppercase font-bold text-gray-600 mb-1.5 block">Nivel de Precio Seleccionado</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { key: 'p1', label: 'P1: Público (PVP)', value: selectedParte.precio1 },
                                { key: 'p2', label: 'P2: Mayorista', value: selectedParte.precio2 },
                                { key: 'p3', label: 'P3: Especial', value: selectedParte.precio3 },
                                { key: 'p4', label: 'P4: Distribución', value: selectedParte.precio4 }
                            ].map(tier => (
                                <button
                                    key={tier.key}
                                    type="button"
                                    onClick={() => {
                                        setActiveTier(tier.key as any);
                                        setItemPrice(String(tier.value || 0));
                                    }}
                                    className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                        activeTier === tier.key
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="opacity-90">{tier.label}</div>
                                    <div className="text-xs mt-0.5">{formatCurrency(tier.value || 0)}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                        <Label htmlFor="cantidad-input">Cantidad *</Label>
                        <div className="relative">
                            <HashtagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                            <input
                                id="cantidad-input"
                                type="number"
                                min="1"
                                value={formData.cantidad}
                                onChange={(e) => handleChange("cantidad", Math.max(1, Number(e.target.value)))}
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-bold focus:outline-none text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-8">
                        <Label htmlFor="precio-input" className="text-xs flex items-center gap-1">
                            Precio Unit.
                            {selectedParte && (
                                selectedParte.permiteModificarPrecio ? (
                                    <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-bold bg-green-50 dark:bg-green-950/20 px-1 py-0.2 rounded border border-green-200 dark:border-green-800 animate-fadeIn">
                                        <LockOpenIcon className="w-3 h-3" aria-hidden="true" /> Editable
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-0.5 text-xs text-red-600 font-bold bg-red-50 dark:bg-red-950/20 px-1 py-0.2 rounded border border-red-200 dark:border-red-800 animate-fadeIn">
                                        <LockClosedIcon className="w-3 h-3" aria-hidden="true" /> Bloqueado
                                    </span>
                                )
                            )}
                        </Label>
                        <div className="relative">
                            <input
                                id="precio-input"
                                type="number"
                                step="0.01"
                                value={itemPrice}
                                disabled={selectedParte && !selectedParte.permiteModificarPrecio}
                                onChange={(e) => {
                                    setItemPrice(e.target.value);
                                    setActiveTier('');
                                }}
                                placeholder="0.00"
                                className={`w-full px-3 py-2 rounded-lg border text-xs font-bold focus:outline-none transition-all ${
                                    selectedParte && !selectedParte.permiteModificarPrecio
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-200 dark:border-gray-600'
                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white'
                                }`}
                            />
                        </div>
                    </div>
                </div>

                {selectedParte && (
                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-600 uppercase font-bold tracking-tighter">Subtotal Calculado</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">
                                {formatCurrency(Number(itemPrice) * Number(formData.cantidad))}
                            </p>
                        </div>
                        <span className="text-xs text-gray-500">
                            * {selectedParte.unidadMedida === 'Servicio' ? 'Servicio no resta stock' : `Stock disponible: ${selectedParte.stock}`}
                        </span>
                    </div>
                )}

                <div>
                    <Label htmlFor="observacion-input">Observación Interna</Label>
                    <textarea
                        id="observacion-input"
                        value={formData.comentario || ''}
                        onChange={(e) => handleChange("comentario", e.target.value)}
                        placeholder="Notas adicionales..."
                        className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white"
                        rows={2}
                    />
                </div>

                <div className="flex justify-between items-center pt-4">
                    {showNavigation && onBack && (
                        <Button type="button" variant="outline" onClick={onBack}>Atrás</Button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <Button type="submit" disabled={loading || loadingPartes} className="px-10 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white font-bold">
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