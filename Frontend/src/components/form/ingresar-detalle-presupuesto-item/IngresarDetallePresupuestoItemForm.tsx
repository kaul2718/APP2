"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { HashtagIcon, TagIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { ItemAlmacen } from "@/hooks/useAlmacen";

interface FormData {
    presupuestoId: number | string;
    parteId: number | string;
    cantidad: number | string;
    comentario?: string;
}

interface IngresarDetallePresupuestoItemFormProps {
    presupuestoId?: number;
    onSuccess?: () => void;
    onClose?: () => void;
    embeddedMode?: boolean;
}

export default function IngresarDetallePresupuestoItemForm({
    presupuestoId: initialPresupuestoId,
    onSuccess,
    onClose,
    embeddedMode = false,
}: IngresarDetallePresupuestoItemFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [partesDisponibles, setPartesDisponibles] = React.useState<ItemAlmacen[]>([]);
    const [loadingPartes, setLoadingPartes] = React.useState(false);

    const [formData, setFormData] = React.useState<FormData>({
        presupuestoId: initialPresupuestoId || "",
        parteId: "",
        cantidad: 1,
        comentario: ""
    });

    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!session?.accessToken) return;

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
                toast.error("Error al cargar el almacén");
            } finally {
                setLoadingPartes(false);
            }
        };

        void loadPartes();
    }, [session?.accessToken]);

    const formatCurrency = (value?: number) =>
        new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
        }).format(Number(value || 0));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.presupuestoId || !formData.parteId) {
            toast.error("Complete los campos obligatorios");
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

            if (!res.ok) throw new Error("Error al registrar");

            toast.success("Producto añadido con éxito ✅");
            if (onSuccess) onSuccess();
            else router.push('/ver-presupuesto');
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-5">
            {!initialPresupuestoId && (
                <div>
                    <Label>ID del Presupuesto *</Label>
                    <div className="relative">
                        <HashtagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            type="number"
                            value={formData.presupuestoId}
                            onChange={(e) => setFormData({...formData, presupuestoId: e.target.value})}
                            className="pl-10"
                        />
                    </div>
                </div>
            )}

            <div>
                <Label>Producto / Repuesto *</Label>
                <div className="relative">
                    <ArchiveBoxIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                    <select
                        value={formData.parteId}
                        onChange={(e) => setFormData({...formData, parteId: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
                    >
                        <option value="">Seleccione un ítem...</option>
                        {partesDisponibles.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} ({p.codigoInterno || p.id}) - {formatCurrency(p.precio1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Cantidad</Label>
                    <div className="relative">
                        <HashtagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            type="number"
                            value={formData.cantidad}
                            onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                            className="pl-10 font-bold"
                        />
                    </div>
                </div>
                <div className="flex items-end">
                     {/* Preview subtotal could go here */}
                </div>
            </div>

            <div>
                <Label>Notas</Label>
                <textarea
                    value={formData.comentario}
                    onChange={(e) => setFormData({...formData, comentario: e.target.value})}
                    placeholder="Comentarios sobre este repuesto..."
                    className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-500"
                    rows={2}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                {onClose && <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>}
                <Button type="submit" disabled={loading} className="px-10">
                    {loading ? "Agregando..." : "Confirmar Adición"}
                </Button>
            </div>
        </form>
    );

    return embeddedMode ? formContent : <ComponentCard title="Añadir Item a Presupuesto">{formContent}</ComponentCard>;
}