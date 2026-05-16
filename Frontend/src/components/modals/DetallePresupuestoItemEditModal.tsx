"use client";
 
import React from "react";
import CrudModal from "@/components/modals/CrudModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { ItemAlmacen, useAlmacen } from "@/hooks/useAlmacen";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { DetallePresupuestoItem } from "@/hooks/useDetallePresupuestoItem";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    detalle: DetallePresupuestoItem | null;
    onSave: (updatedDetalle: DetallePresupuestoItem) => void;
}

export default function DetallePresupuestoItemEditModal({ isOpen, onClose, detalle, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const [partesDisponibles, setPartesDisponibles] = React.useState<ItemAlmacen[]>([]);
    const [loadingPartes, setLoadingPartes] = React.useState(false);
    const [editando, setEditando] = React.useState<Partial<DetallePresupuestoItem> | null>(detalle);
    const [cargando, setCargando] = React.useState(false);

    React.useEffect(() => {
        setEditando(detalle);
    }, [detalle]);

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
                toast.error("Error al cargar el catálogo de almacén");
            } finally {
                setLoadingPartes(false);
            }
        };

        void loadPartes();
    }, [isOpen, session?.accessToken]);

    const formatCurrency = (value?: number) =>
        new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
        }).format(Number(value || 0));

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? { ...prev, [name]: value === '' ? '' : Number(value) } : null);
    };

    const handleParteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const parteId = Number(e.target.value);
        const p = partesDisponibles.find((item) => item.id === parteId);

        setEditando(prev => {
            if (!prev) return null;
            return {
                ...prev,
                parteId,
                precioUnitario: p ? p.precio1 : prev.precioUnitario
            } as Partial<DetallePresupuestoItem>;
        });
    };

    const handleSubmit = async () => {
        if (!editando || !token || !detalle) return;

        if (!editando.parteId) {
            toast.error("Debe seleccionar un producto");
            return;
        }

        setCargando(true);
        try {
            const cambios = {
                parteId: Number(editando.parteId),
                cantidad: Number(editando.cantidad),
                comentario: editando.comentario || null
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-presupuesto-item/${detalle.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(cambios),
            });

            if (!response.ok) throw new Error("Error al actualizar");

            const data = await response.json();
            onSave(data);
            toast.success("Presupuesto actualizado");
            onClose();
        } catch (error) {
            toast.error("Error al guardar cambios");
        } finally {
            setCargando(false);
        }
    };

    if (!editando) return null;

    const subtotal = (editando.precioUnitario || 0) * (Number(editando.cantidad) || 0);

    return (
        <CrudModal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Item del Presupuesto"
            onSubmit={handleSubmit}
            loading={cargando}
            mode="edit"
        >
            <div className="space-y-5 p-4 lg:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Label>Producto de Almacén *</Label>
                        <select
                            value={editando.parteId || ""}
                            onChange={handleParteChange}
                            disabled={cargando || loadingPartes}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                            <option value="">Seleccione un producto...</option>
                            {partesDisponibles.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre} ({p.codigoInterno || p.id}) - {formatCurrency(p.precio1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label>Cantidad</Label>
                        <Input
                            name="cantidad"
                            type="number"
                            value={editando.cantidad || ""}
                            onChange={handleNumberChange}
                            required
                        />
                    </div>

                    <div>
                        <Label>Precio Unitario (PVP 1)</Label>
                        <div className="relative">
                            <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input value={formatCurrency(editando.precioUnitario)} disabled className="pl-10 font-bold bg-gray-50" />
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-brand-50 dark:bg-brand-900/10 p-3 rounded-lg flex justify-between items-center border border-brand-100">
                        <span className="text-sm font-bold text-brand-700 uppercase">Subtotal Estimado</span>
                        <span className="text-lg font-black text-brand-900 dark:text-brand-200">{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="md:col-span-2">
                        <Label>Comentario Adicional</Label>
                        <Input
                            name="comentario"
                            value={editando.comentario || ""}
                            onChange={(e) => setEditando(prev => prev ? { ...prev, comentario: e.target.value } : null)}
                            placeholder="Notas sobre este repuesto..."
                        />
                    </div>
                </div>
            </div>
        </CrudModal>
    );
}