"use client";

import React from "react";
import CrudModal from "@/components/modals/CrudModal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Parte as CatalogoParte, usePartes } from "@/hooks/usePartes";
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
    const { fetchAllPartes } = usePartes();
    const [partesDisponibles, setPartesDisponibles] = React.useState<CatalogoParte[]>([]);
    const [loadingPartes, setLoadingPartes] = React.useState(false);
    const [editando, setEditando] = React.useState<Partial<DetallePresupuestoItem> | null>(detalle);
    const [cargando, setCargando] = React.useState(false);

    React.useEffect(() => {
        setEditando(detalle);
    }, [detalle]);

    React.useEffect(() => {
        if (!isOpen || !session?.accessToken) return;

        let isMounted = true;

        const loadPartes = async () => {
            setLoadingPartes(true);
            try {
                const data = await fetchAllPartes(false);
                if (isMounted) {
                    setPartesDisponibles(data.filter((parte) => parte.estado));
                }
            } catch (error) {
                if (isMounted) {
                    toast.error(error instanceof Error ? error.message : "Error al cargar el catálogo");
                }
            } finally {
                if (isMounted) {
                    setLoadingPartes(false);
                }
            }
        };

        void loadPartes();

        return () => {
            isMounted = false;
        };
    }, [isOpen, session?.accessToken]);

    const formatParteLabel = (parte: CatalogoParte) => {
        const codigo = parte.codigoInterno || `ITEM-${parte.id}`;
        const precio = Number(parte.precioReferencia ?? 0);
        return `${parte.nombre} - ${codigo} ($${precio.toLocaleString('es-CL')})`;
    };

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

    const handleParteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const parteId = Number(e.target.value);
        const parteSeleccionada = partesDisponibles.find((parte) => parte.id === parteId);

        setEditando(prev => {
            if (!prev) return null;

            return {
                ...prev,
                parteId,
                parte: parteSeleccionada
                    ? {
                        id: parteSeleccionada.id,
                        nombre: parteSeleccionada.nombre,
                        codigoInterno: parteSeleccionada.codigoInterno,
                        precioReferencia: parteSeleccionada.precioReferencia,
                      }
                    : prev.parte,
            } as Partial<DetallePresupuestoItem>;
        });
    };

    const handleCancel = () => {
        onClose();
    };

    // Modifica la función handleSubmit así:
    const handleSubmit = async () => {
        if (!editando || !token || !detalle) return;

        // Validaciones
        const parteSeleccionadaId = Number(editando.parteId || 0);

        if (!parteSeleccionadaId) {
            toast.error("Debe seleccionar un ítem");
            return;
        }

        if (!editando.cantidad || Number(editando.cantidad) <= 0) {
            toast.error("La cantidad debe ser mayor a 0");
            return;
        }

        setCargando(true);

        try {
            const cambios: any = {
                parteId: parteSeleccionadaId,
                cantidad: Number(editando.cantidad)
            };

            // Solo incluir comentario si ha cambiado
            if (editando.comentario !== detalle.comentario) {
                cambios.comentario = editando.comentario || null;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/detalles-presupuesto-item/${detalle.id}`, {
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

            const detalleActualizado = {
                ...data,
                precioUnitario: data.precioUnitario,
                subtotal: data.subtotal,
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

        const parteSeleccionadaId = Number(editando.parteId || 0);
        const parteOriginalId = detalle?.parte?.id ?? 0;

        if (parteSeleccionadaId && parteSeleccionadaId !== parteOriginalId) {
            const parte = partesDisponibles.find((item) => item.id === parteSeleccionadaId);
            return Number(parte?.precioReferencia ?? 0);
        }

        return Number(detalle?.precioUnitario || editando.parte?.precioReferencia || 0);
    };

    const calcularSubtotal = () => {
        const cantidad = editando?.cantidad || detalle?.cantidad || 0;
        return calcularPrecioUnitario() * cantidad;
    };

    if (!editando) return null;

    return (
        <CrudModal
            isOpen={isOpen}
            onClose={handleCancel}
            title="Editar Detalle de Ítem"
            onSubmit={handleSubmit}
            loading={cargando}
            mode="edit"
        >
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar detalle del ítem
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Puedes modificar los datos del detalle. Los cambios se guardarán al presionar "Guardar cambios".
                </p>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                    }}
                    className="flex flex-col"
                >
                    <div className="custom-scrollbar h-[500px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div>
                                <Label>ID</Label>
                                <Input name="id" value={editando.id} disabled />
                            </div>

                            <div>
                                <Label>Presupuesto ID</Label>
                                <Input name="presupuestoId" value={editando.presupuestoId ?? ""} disabled />
                            </div>

                            <div className="lg:col-span-2">
                                <Label>Ítem / Parte *</Label>
                                <div className="relative">
                                    <select
                                        value={editando.parteId || ""}
                                        onChange={handleParteChange}
                                        disabled={cargando || loadingPartes}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                    >
                                        <option value="">Seleccione un ítem</option>
                                        {partesDisponibles.map((parte) => (
                                            <option key={parte.id} value={parte.id}>
                                                {formatParteLabel(parte)}
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
                                    placeholder="Agregar comentario sobre este ítem"
                                    disabled={cargando}
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </CrudModal>
    );
}