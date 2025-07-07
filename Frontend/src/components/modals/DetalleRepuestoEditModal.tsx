"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRepuesto } from "@/hooks/useRepuesto";
import { CurrencyDollarIcon, TagIcon } from "@heroicons/react/24/outline";
import { DetalleRepuesto } from "@/hooks/useDetalleRepuesto";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    detalle: DetalleRepuesto | null;
    onSave: (updatedDetalle: DetalleRepuesto) => void;
}

export default function DetalleRepuestoEditModal({ isOpen, onClose, detalle, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const { repuestos, loading: loadingRepuestos } = useRepuesto();
    const [editando, setEditando] = React.useState<Partial<DetalleRepuesto> | null>(detalle);
    const [cargando, setCargando] = React.useState(false);

    React.useEffect(() => {
        setEditando(detalle);
    }, [detalle]);

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? {
            ...prev,
            [name]: value === '' ? '' : Number(value)
        } : null);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditando(prev => prev ? {
            ...prev,
            [name]: value
        } : null);
    };

    const handleRepuestoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const repuestoId = Number(e.target.value);
        const repuestoSeleccionado = repuestos.find(r => r.id === repuestoId);

        setEditando(prev => {
            if (!prev) return null;

            return {
                ...prev,
                repuestoId: repuestoId,
                repuesto: repuestoSeleccionado ?? undefined
            } as Partial<DetalleRepuesto>;
        });
    };

    const handleCancel = () => {
        onClose();
    };

    // Modifica la función handleSubmit así:
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editando || !token || !detalle) return;

        // Validaciones
        if (!editando.repuestoId) {
            toast.error("Debe seleccionar un repuesto");
            return;
        }

        if (!editando.cantidad || Number(editando.cantidad) <= 0) {
            toast.error("La cantidad debe ser mayor a 0");
            return;
        }

        setCargando(true);

        try {
            const cambios: any = {
                repuestoId: editando.repuestoId,
                cantidad: Number(editando.cantidad)
            };

            // Solo incluir comentario si ha cambiado
            if (editando.comentario !== detalle.comentario) {
                cambios.comentario = editando.comentario || null;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-repuestos/${detalle.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(cambios),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al actualizar: ${response.status}`);
            }

            const data = await response.json();

            // Obtener el repuesto completo del estado local o de la respuesta
            const repuestoCompleto = repuestos.find(r => r.id === editando.repuestoId) || data.repuesto;

            // Construir objeto completo con todos los datos
            const detalleActualizado = {
                ...data,
                repuesto: repuestoCompleto,
                precioUnitario: repuestoCompleto?.precioVenta || data.precioUnitario,
                subtotal: (repuestoCompleto?.precioVenta || data.precioUnitario) * (editando.cantidad || data.cantidad)
            };

            onSave(detalleActualizado);
            toast.success("Cambios guardados correctamente");
            onClose();
        } catch (error) {
            console.error("Error al guardar cambios:", error);
            toast.error(error instanceof Error ? error.message : "Error al guardar cambios");
            setEditando(detalle); // Restaurar estado original en caso de error
        } finally {
            setCargando(false);
        }
    };

    // Calcular precios para mostrar en la UI
    const calcularPrecioUnitario = () => {
        if (!editando) return 0;
        if (editando.repuestoId && editando.repuestoId !== detalle?.repuestoId) {
            const repuesto = repuestos.find(r => r.id === editando.repuestoId);
            return repuesto?.precioVenta || 0;
        }
        return detalle?.precioUnitario || 0;
    };

    const calcularSubtotal = () => {
        const cantidad = editando?.cantidad || detalle?.cantidad || 0;
        return calcularPrecioUnitario() * cantidad;
    };

    if (!editando) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[700px] m-4" title="Editar Detalle de Repuesto">
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar detalle de repuesto
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Puedes modificar los datos del detalle. Los cambios se guardarán al presionar "Guardar cambios".
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="custom-scrollbar h-[500px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label>ID</Label>
                                <Input name="id" value={editando.id} disabled />
                            </div>

                            <div>
                                <Label>Presupuesto ID</Label>
                                <Input name="presupuestoId" value={editando.presupuestoId} disabled />
                            </div>

                            <div className="lg:col-span-2">
                                <Label>Repuesto *</Label>
                                <div className="relative">
                                    <select
                                        value={editando.repuestoId || ""}
                                        onChange={handleRepuestoChange}
                                        disabled={cargando || loadingRepuestos}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                    >
                                        <option value="">Seleccione un repuesto</option>
                                        {repuestos
                                            .filter(repuesto => repuesto.estado)
                                            .map((repuesto) => (
                                                <option key={repuesto.id} value={repuesto.id}>
                                                    {repuesto.nombre} - {repuesto.codigo} (${repuesto.precioVenta})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label>Cantidad *</Label>
                                <Input
                                    name="cantidad"
                                    type="number"
                                    min="1"
                                    step={1}
                                    value={editando.cantidad || ""}
                                    onChange={handleNumberChange}
                                    required
                                    disabled={cargando}
                                />
                            </div>

                            <div>
                                <Label>Precio Unitario</Label>
                                <div className="relative">
                                    <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        value={calcularPrecioUnitario()}
                                        disabled
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Subtotal</Label>
                                <div className="relative">
                                    <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        value={calcularSubtotal()}
                                        disabled
                                        className="pl-10 font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Fecha de Uso</Label>
                                <Input
                                    value={editando.fechaUso ? new Date(editando.fechaUso).toLocaleString() : "No especificada"}
                                    disabled
                                />
                            </div>

                            <div>
                                <Label>Fecha de creación</Label>
                                <Input
                                    value={new Date(editando.createdAt || "").toLocaleString()}
                                    disabled
                                />
                            </div>

                            <div>
                                <Label>Última actualización</Label>
                                <Input
                                    value={new Date(editando.updatedAt || "").toLocaleString()}
                                    disabled
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <Label>Comentario</Label>
                                <Input
                                    name="comentario"
                                    value={editando.comentario || ""}
                                    onChange={handleTextChange}
                                    placeholder="Agregar comentario sobre este repuesto"
                                    disabled={cargando}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={cargando}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={cargando || loadingRepuestos} loading={cargando}>
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}