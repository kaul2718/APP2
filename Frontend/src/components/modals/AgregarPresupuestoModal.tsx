'use client';
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Combobox } from "@headlessui/react";
import {
    DocumentTextIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    PlusIcon,
    ArchiveBoxIcon,
    SparklesIcon,
    TagIcon,
    CheckIcon,
    LockClosedIcon,
    LockOpenIcon
} from "@heroicons/react/24/outline";
import { useOrders } from "@/hooks/useOrders";
import { useEstadoPresupuesto } from "@/hooks/useEstadoPresupuesto";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import { ItemAlmacen } from "@/hooks/useAlmacen";
import { apiRequest } from "@/lib/api";

interface FormData {
    ordenId: number | null;
    estadoId: number | null;
    descripcion: string;
}

interface FormErrors {
    ordenId?: string;
    estadoId?: string;
    descripcion?: string;
}

interface SelectedItem {
    id: number; // parteId
    nombre: string;
    codigoInterno?: string;
    unidadMedida: string;
    precioUnitario: number;
    cantidad: number;
    subtotal: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (id: number) => void;
    orderId?: number | null;
}

export default function AgregarPresupuestoModal({
    isOpen,
    onClose,
    onSuccess,
    orderId = null
}: Props) {
    const { data: session } = useSession();
    const { createPresupuesto } = usePresupuesto();
    const { orders, loading: loadingOrders } = useOrders();
    const { estados, loading: loadingEstados } = useEstadoPresupuesto();

    // Estado básico
    const [formData, setFormData] = useState<FormData>({
        ordenId: orderId,
        estadoId: null,
        descripcion: ""
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);

    // Estado para catálogo y selección de items
    const [partesCatalog, setPartesCatalog] = useState<ItemAlmacen[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");

    // Draft local de items agregados
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

    // Formulario de item individual
    const [itemQty, setItemQty] = useState<number>(1);
    const [itemPrice, setItemPrice] = useState<string>("");
    const [activeTier, setActiveTier] = useState<'p1' | 'p2' | 'p3' | 'p4' | ''>('p1');

    // Cargar catálogo de repuestos/servicios al abrir el modal
    useEffect(() => {
        if (!isOpen || !session?.accessToken) return;

        const loadCatalog = async () => {
            setLoadingCatalog(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/partes?includeInactive=false`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    setPartesCatalog(data.filter((p: any) => p.estado));
                }
            } catch (error) {
                console.error("Error al cargar catálogo:", error);
                toast.error('Error al cargar catálogo de productos y servicios');
            } finally {
                setLoadingCatalog(false);
            }
        };

        void loadCatalog();
    }, [isOpen, session?.accessToken]);

    // Inicializar orden y estado pendiente
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            ordenId: orderId
        }));
    }, [orderId]);

    useEffect(() => {
        if (estados.length > 0 && formData.estadoId === null) {
            const estadoPendiente = estados.find(e => e.nombre.toLowerCase() === 'pendiente');
            if (estadoPendiente) {
                setFormData(prev => ({ ...prev, estadoId: estadoPendiente.id }));
            }
        }
    }, [estados, formData.estadoId]);

    const handleClose = () => {
        setFormData({
            ordenId: orderId,
            estadoId: null,
            descripcion: ""
        });
        setSelectedItems([]);
        setSelectedCatalogId("");
        setItemQty(1);
        setItemPrice("");
        setErrors({});
        onClose();
    };

    const handleChange = (field: keyof FormData, value: string | number | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Prellenar precio al elegir un elemento del catálogo
    const handleCatalogSelect = (val: string) => {
        setSelectedCatalogId(val);
        setActiveTier('p1');
        const item = partesCatalog.find(p => String(p.id) === String(val));
        if (item) {
            setItemPrice(String(item.precio1 || 0));
        }
    };

    // Filtrar catálogo según término de búsqueda
    const filteredPartes = searchTerm === ""
        ? partesCatalog
        : partesCatalog.filter(p =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.codigoInterno && p.codigoInterno.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    // Añadir item al borrador local
    const handleAddItemToDraft = () => {
        if (!selectedCatalogId) {
            toast.warning("Debe seleccionar un producto o servicio");
            return;
        }

        const item = partesCatalog.find(p => String(p.id) === String(selectedCatalogId));
        if (!item) return;

        const qty = Number(itemQty);
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

            const alreadyAddedQty = selectedItems
                .filter(i => i.id === item.id)
                .reduce((sum, i) => sum + i.cantidad, 0);

            const totalRequested = alreadyAddedQty + qty;

            if (totalRequested > item.stock) {
                toast.error(
                    alreadyAddedQty > 0
                        ? `No puedes agregar más de este producto. Ya agregaste ${alreadyAddedQty} u. y el total solicitado (${totalRequested} u.) supera el stock disponible (${item.stock} u.).`
                        : `No puedes agregar ${qty} u. del producto "${item.nombre}". Solo hay ${item.stock} u. disponibles en stock.`
                );
                return;
            }
        }

        const existingIndex = selectedItems.findIndex(i => i.id === item.id);
        if (existingIndex > -1) {
            // Actualizar existente
            const updated = [...selectedItems];
            updated[existingIndex].cantidad += qty;
            updated[existingIndex].subtotal = updated[existingIndex].cantidad * updated[existingIndex].precioUnitario;
            setSelectedItems(updated);
        } else {
            // Añadir nuevo
            const newItem: SelectedItem = {
                id: item.id,
                nombre: item.nombre,
                codigoInterno: item.codigoInterno ?? undefined,
                unidadMedida: item.unidadMedida || 'Unidad',
                precioUnitario: price,
                cantidad: qty,
                subtotal: qty * price
            };
            setSelectedItems(prev => [...prev, newItem]);
        }

        // Reset selector
        setSelectedCatalogId("");
        setActiveTier('p1');
        setItemQty(1);
        setItemPrice("");
        setSearchTerm("");
        toast.success("Agregado al borrador");
    };

    // Remover item del borrador local
    const handleRemoveItemFromDraft = (index: number) => {
        setSelectedItems(prev => prev.filter((_, i) => i !== index));
    };

    // Totales calculados en el cliente
    const totalServicios = selectedItems
        .filter(i => i.unidadMedida === 'Servicio')
        .reduce((sum, item) => sum + item.subtotal, 0);

    const totalProductos = selectedItems
        .filter(i => i.unidadMedida !== 'Servicio')
        .reduce((sum, item) => sum + item.subtotal, 0);

    const totalGeneral = totalServicios + totalProductos;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
        }).format(value);

    // Enviar y persistir todo en un solo flujo
    const handleSubmitAll = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones del formulario principal
        const newErrors: FormErrors = {};
        let isValid = true;
        if (!formData.ordenId) {
            newErrors.ordenId = "Debe seleccionar una orden";
            isValid = false;
        }
        if (!formData.estadoId) {
            newErrors.estadoId = "Debe seleccionar un estado";
            isValid = false;
        }
        if (!formData.descripcion.trim()) {
            newErrors.descripcion = "La descripción es requerida";
            isValid = false;
        }

        setErrors(newErrors);
        if (!isValid) {
            toast.error("Por favor, rellene los campos obligatorios");
            return;
        }

        setLoading(true);

        try {
            // 1. Crear el presupuesto base
            const presupuestoData = {
                ordenId: Number(formData.ordenId),
                estadoId: Number(formData.estadoId),
                descripcion: formData.descripcion
            };

            const result = await createPresupuesto(presupuestoData);

            if (!result?.id) {
                throw new Error("No se pudo crear el presupuesto base.");
            }

            const newPresupuestoId = result.id;

            // 2. Si hay elementos en la lista, guardarlos en paralelo
            if (selectedItems.length > 0) {
                const addPromises = selectedItems.map(item => {
                    const payload = {
                        presupuestoId: newPresupuestoId,
                        parteId: item.id,
                        cantidad: item.cantidad,
                        precioUnitario: item.precioUnitario
                    };
                    return apiRequest(
                        '/detalles-presupuesto-item',
                        {
                            method: "POST",
                            body: JSON.stringify(payload)
                        },
                        session
                    );
                });

                await Promise.all(addPromises);
            }

            toast.success("¡Presupuesto y desglose creados exitosamente! 🚀", {
                position: "top-center",
                autoClose: 3500,
            });

            if (onSuccess) {
                onSuccess(newPresupuestoId);
            }
            handleClose();

        } catch (error) {
            console.error("Error al registrar presupuesto con items:", error);
            toast.error(
                error instanceof Error ? error.message : "Error al procesar la creación del presupuesto"
            );
        } finally {
            setLoading(false);
        }
    };

    const selectedParteDetails = partesCatalog.find(p => String(p.id) === String(selectedCatalogId));

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            className="max-w-5xl mx-4"
            title="Crear Presupuesto"
        >
            <form onSubmit={handleSubmitAll} className="text-gray-700 dark:text-gray-300 p-6 md:p-8 space-y-6">
                <div className="flex flex-col gap-1.5 border-b pb-4 border-gray-250 dark:border-gray-700">
                    <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                        Crear Presupuesto
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Completa la información básica y añade productos o servicios del catálogo en un único paso interactivo.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Panel Izquierdo: Información Básica */}
                    <div className="lg:col-span-5 space-y-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 border-b pb-2">
                            <SparklesIcon className="w-5 h-5 text-blue-500" aria-hidden="true" />
                            1. Datos Generales
                        </h3>

                        {/* Selección de orden */}
                        <div>
                            <Label htmlFor="order-select" className="mb-1 block font-medium">Orden de Trabajo *</Label>
                            <div className="relative">
                                {orderId ? (
                                    <>
                                        <input
                                            type="text"
                                            id="order-select"
                                            readOnly
                                            value={(() => {
                                                const order = orders.find((o) => o.id === formData.ordenId);
                                                return order
                                                    ? `#${order.workOrderNumber} - ${order.client?.nombre} ${order.client?.apellido}`
                                                    : '';
                                            })()}
                                            className="w-full bg-gray-100 dark:bg-white/[0.03] text-black dark:text-white p-2.5 pl-10 rounded-lg border border-gray-300 dark:border-white/[0.08] cursor-not-allowed text-xs font-semibold"
                                            disabled
                                        />
                                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" aria-hidden="true" />
                                    </>
                                ) : (
                                    <>
                                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" aria-hidden="true" />
                                        <select
                                            id="order-select"
                                            value={formData.ordenId || ""}
                                            onChange={(e) => handleChange("ordenId", Number(e.target.value))}
                                            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-xs font-semibold"
                                        >
                                            <option value="" disabled>Seleccione una Orden de Trabajo</option>
                                            {orders.map((order) => (
                                                <option key={order.id} value={order.id}>
                                                    #{order.workOrderNumber} - {order.client?.nombre || ''} {order.client?.apellido || ''} {order.equipo?.tipoEquipo?.nombre || order.equipo?.modelo?.nombre ? `[${order.equipo.tipoEquipo?.nombre || ''} ${order.equipo.marca?.nombre || ''} ${order.equipo.modelo?.nombre || ''}]` : ''} {order.problemaReportado ? `(${order.problemaReportado})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>
                            {errors.ordenId && (
                                <p role="alert" className="text-xs text-red-500 mt-1">{errors.ordenId}</p>
                            )}
                        </div>

                        {/* Estado del presupuesto */}
                        <div>
                            <Label htmlFor="estado-select" className="mb-1 block font-medium">Estado Inicial *</Label>
                            <div className="relative">
                                <DocumentTextIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" aria-hidden="true" />
                                <select
                                    id="estado-select"
                                    value={formData.estadoId || ""}
                                    onChange={(e) => handleChange("estadoId", Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-xs"
                                >
                                    <option value="" disabled>Seleccione un estado</option>
                                    {estados.map((estado) => (
                                        <option key={estado.id} value={estado.id}>
                                            {estado.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Descripción */}
                        <div>
                            <Label htmlFor="descripcion-textarea" className="mb-1 block font-medium">Descripción / Diagnóstico *</Label>
                            <div className="relative">
                                <DocumentTextIcon className="w-5 h-5 text-gray-400 absolute left-3 top-4" aria-hidden="true" />
                                <textarea
                                    id="descripcion-textarea"
                                    value={formData.descripcion}
                                    onChange={(e) => handleChange("descripcion", e.target.value)}
                                    placeholder="Detalles sobre el diagnóstico, repuestos requeridos o notas técnicas..."
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white border ${errors.descripcion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs`}
                                    rows={4}
                                />
                            </div>
                            {errors.descripcion && (
                                <p role="alert" className="text-xs text-red-500 mt-1">{errors.descripcion}</p>
                            )}
                        </div>
                    </div>

                    {/* Panel Derecho: Selección y Tabla de Items */}
                    <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 border-b pb-2">
                                <ArchiveBoxIcon className="w-5 h-5 text-amber-500" aria-hidden="true" />
                                2. Repuestos y Servicios
                            </h3>

                            {/* Selector de Items Combobox */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4 items-end">
                                <div className="md:col-span-6">
                                    <Label htmlFor="combo-item" className="text-xs">Seleccionar Ítem o Servicio *</Label>
                                    <Combobox value={selectedCatalogId} onChange={handleCatalogSelect}>
                                        <div className="relative">
                                            <div className="relative w-full">
                                                <TagIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" aria-hidden="true" />
                                                <Combobox.Input
                                                    id="combo-item"
                                                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                    displayValue={(val: any) => {
                                                        const p = partesCatalog.find(x => String(x.id) === String(val));
                                                        return p ? `${p.nombre} (${p.codigoInterno || p.id})` : "";
                                                    }}
                                                    placeholder="Buscar en el almacén..."
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>

                                            <Combobox.Options className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-white py-1 shadow-2xl ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs">
                                                {loadingCatalog ? (
                                                    <div className="py-2 px-3 text-gray-500">Cargando catálogo...</div>
                                                ) : filteredPartes.length === 0 ? (
                                                    <div className="py-2 px-3 text-gray-500">No se encontraron resultados</div>
                                                ) : (
                                                    filteredPartes.map((p) => (
                                                        <Combobox.Option key={p.id} value={String(p.id)} className={({ active }) => `relative cursor-pointer select-none py-2 pl-9 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-300'}`}>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center justify-between font-medium">
                                                                    <span>{p.nombre}</span>
                                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${p.unidadMedida === 'Servicio'
                                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                                                                        }`}>
                                                                        {p.unidadMedida === 'Servicio' ? 'Servicio' : 'Repuesto'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs opacity-75">
                                                                    PVP: {formatCurrency(p.precio1 || 0)} {p.unidadMedida !== 'Servicio' && `| Stock: ${p.stock}`}
                                                                </span>
                                                            </div>
                                                        </Combobox.Option>
                                                    ))
                                                )}
                                            </Combobox.Options>
                                        </div>
                                    </Combobox>
                                </div>

                                {selectedParteDetails && selectedParteDetails.unidadMedida !== 'Servicio' && (
                                    <div className="md:col-span-12 mt-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-200 dark:border-gray-700 animate-fadeIn">
                                        <p className="text-xs uppercase font-bold text-gray-600 mb-1.5 block">Nivel de Precio Seleccionado</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                                { key: 'p1', label: 'P1: Público (PVP)', value: selectedParteDetails.precio1 },
                                                { key: 'p2', label: 'P2: Mayorista', value: selectedParteDetails.precio2 },
                                                { key: 'p3', label: 'P3: Especial', value: selectedParteDetails.precio3 },
                                                { key: 'p4', label: 'P4: Distribución', value: selectedParteDetails.precio4 }
                                            ].map(tier => (
                                                <button
                                                    key={tier.key}
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveTier(tier.key as any);
                                                        setItemPrice(String(tier.value || 0));
                                                    }}
                                                    className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition-all ${activeTier === tier.key
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

                                <div className="md:col-span-3">
                                    <Label htmlFor="cant-input" className="text-xs">Cant.</Label>
                                    <input
                                        id="cant-input"
                                        type="number"
                                        min="1"
                                        value={itemQty}
                                        onChange={(e) => setItemQty(Math.max(1, Number(e.target.value)))}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-5">
                                    <Label htmlFor="precio-input" className="text-xs flex items-center gap-1">
                                        Precio Unit.
                                        {selectedParteDetails && (
                                            selectedParteDetails.permiteModificarPrecio ? (
                                                <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-bold bg-green-50 dark:bg-green-950/20 px-1 py-0.5 rounded border border-green-200 dark:border-green-800 animate-fadeIn">
                                                    <LockOpenIcon className="w-3 h-3" aria-hidden="true" /> Editable
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-0.5 text-xs text-red-600 font-bold bg-red-50 dark:bg-red-950/20 px-1 py-0.5 rounded border border-red-200 dark:border-red-800 animate-fadeIn">
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
                                            disabled={selectedParteDetails && !selectedParteDetails.permiteModificarPrecio}
                                            onChange={(e) => {
                                                setItemPrice(e.target.value);
                                                setActiveTier('');
                                            }}
                                            placeholder="0.00"
                                            className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-all ${selectedParteDetails && !selectedParteDetails.permiteModificarPrecio
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-200 dark:border-gray-600'
                                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'
                                                }`}
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-4">
                                    <button
                                        type="button"
                                        onClick={handleAddItemToDraft}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 flex items-center justify-center gap-1 font-bold text-xs shadow-sm transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" aria-hidden="true" /> Añadir al Presupuesto
                                    </button>
                                </div>
                            </div>

                            {/* Detalle visual de los elementos agregados */}
                            <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/20 max-h-56 overflow-y-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-gray-100 dark:bg-gray-800 font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-4 py-2.5">Detalle / Elemento</th>
                                            <th className="px-3 py-2.5 text-center">Cant.</th>
                                            <th className="px-3 py-2.5 text-right">P. Unit.</th>
                                            <th className="px-3 py-2.5 text-right">Subtotal</th>
                                            <th className="px-4 py-2.5 text-center w-12">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {selectedItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-600 dark:text-gray-400">
                                                    Ningún elemento agregado al borrador del presupuesto.
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-100/50 dark:hover:bg-gray-850/50 transition-colors">
                                                    <td className="px-4 py-2">
                                                        <div className="font-medium text-gray-900 dark:text-white">{item.nombre}</div>
                                                        <span className={`inline-block px-1 py-0.5 rounded text-xs font-bold mt-0.5 uppercase tracking-widest ${item.unidadMedida === 'Servicio'
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                                                            }`}>
                                                            {item.unidadMedida === 'Servicio' ? 'Servicio' : 'Repuesto'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-center font-medium">{item.cantidad}</td>
                                                    <td className="px-3 py-2 text-right">{formatCurrency(item.precioUnitario)}</td>
                                                    <td className="px-3 py-2 text-right font-bold text-gray-950 dark:text-white">{formatCurrency(item.subtotal)}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItemFromDraft(idx)}
                                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 inline-flex transition-colors"
                                                            aria-label="Eliminar elemento del borrador"
                                                        >
                                                            <TrashIcon className="w-4 h-4" aria-hidden="true" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Caja de Costos y Acciones */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-150 dark:border-gray-700/80 mb-6">
                                <div className="text-center">
                                    <div className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400">Repuestos</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(totalProductos)}</div>
                                </div>
                                <div className="text-center border-x border-gray-250 dark:border-gray-700">
                                    <div className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400">Servicios</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(totalServicios)}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs uppercase font-bold text-blue-500 dark:text-blue-400">Total General</div>
                                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalGeneral)}</div>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="w-full sm:w-auto text-xs"
                                >
                                    Cancelar
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={loading || loadingOrders || loadingEstados}
                                    loading={loading}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-all duration-200"
                                >
                                    {loading ? "Creando Presupuesto..." : "Crear Presupuesto"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
}