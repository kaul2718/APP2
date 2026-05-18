'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useDetallePresupuestoItem, DetallePresupuestoItem } from "./useDetallePresupuestoItem";
import { useEstadoPresupuesto } from "./useEstadoPresupuesto";
import { apiRequest } from "@/lib/api";

export interface Presupuesto {
    id: number;
    ordenId: number;
    estadoId: number;
    descripcion: string | null;
    fechaEmision: string;
    deletedAt?: string | null;
    estado?: EstadoPresupuesto | null; // Permitir null
    orden?: Order | null; // Añadir | null aquí
    detallesPresupuestoItems?: DetallePresupuestoItem[];
}

export interface EstadoPresupuesto {
    id: number;
    nombre: string;
}

export interface Order {
    id: number;
    workOrderNumber: string;
}

interface PaginatedPresupuestoResponse {
    items: Presupuesto[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
}

export interface ResumenPresupuesto {
    presupuestoId: number;
    descripcion: string | null;
    fechaEmision: string;
    orden: {
        numeroOrden: string;
        clienteId: number;
        equipoId: number;
    };
    detalleManoObra: Array<{
        tipo: string;
        cantidad: number;
        costoUnitario: number;
        costoTotal: number;
    }>;
    detalleItems: Array<{
        nombre: string;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
    }>;
    costoManoObra: number;
    costoItems: number;
    costoTotal: number;
}


export function usePresupuesto() {
    const { data: session, status } = useSession();
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showInactive, setShowInactive] = useState<boolean>(false);
    const { estados } = useEstadoPresupuesto(); // <-- Añadir esta línea

    // Usamos los hooks de detalles
    const {
        fetchDetallesByPresupuesto: fetchItemsByPresupuesto,
        calculateTotalByPresupuesto: calculateTotalItems
    } = useDetallePresupuestoItem();


    const fetchPresupuestos = async (
        page: number = 1,
        limit: number = 10,
        search: string = "",
        includeInactive: boolean = false
    ) => {
        try {
            setLoading(true);

            if (!session?.accessToken) throw new Error("Token no disponible");

            const params = new URLSearchParams();
            params.append('page', String(page));
            params.append('limit', String(limit));
            if (search) params.append('search', search);
            if (includeInactive) params.append('includeDeleted', 'true');

            const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/presupuestos/all?${params}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: `Error ${response.status}: ${response.statusText}` };
                }
                throw new Error(errorData.message || 'Error al obtener presupuestos');
            }

            const data: PaginatedPresupuestoResponse = await response.json();

            if (!data?.items || !Array.isArray(data.items)) {
                throw new Error("Formato de respuesta inválido");
            }

            // Cargar detalles para cada presupuesto con manejo robusto de errores
            const presupuestosConDetalles = await Promise.all(
                data.items.map(async (presupuesto) => {
                    try {
                        const detallesPresupuestoItems = await fetchItemsByPresupuesto(presupuesto.id, includeInactive)
                            .then(res => res || [])
                            .catch(() => []);

                        return {
                            ...presupuesto,
                            detallesPresupuestoItems: Array.isArray(detallesPresupuestoItems) ? detallesPresupuestoItems : []
                        };
                    } catch (error) {
                        return {
                            ...presupuesto,
                            detallesPresupuestoItems: []
                        };
                    }
                })
            );

            setPresupuestos(presupuestosConDetalles);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
            setCurrentPage(data.currentPage);
        } catch (error) {
            //console.error("Error en fetchPresupuestos:", error);
            toast.error(error instanceof Error ? error.message : "Error al cargar presupuestos");
            setPresupuestos([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPresupuestoById = async (id: number, includeDetails: boolean = true) => {
        try {
            setLoading(true);

            if (!session?.accessToken) throw new Error("Token de sesión no disponible");

            const data = await apiRequest<Presupuesto>(`/presupuestos/${id}`, {}, session);
            setPresupuesto(data);

            if (includeDetails) {
                try {
                    const detallesPresupuestoItems = await fetchItemsByPresupuesto(id).then(res => res || []);

                    setPresupuesto(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            detallesPresupuestoItems
                        };
                    });
                } catch (error) {
                    toast.error("Error cargando detalles del presupuesto");
                }
            }

            return data;
        } catch (error) {
            //console.error("Error al obtener presupuesto:", error);
            toast.error(error instanceof Error ? error.message : "Error al cargar presupuesto");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const createPresupuesto = async (presupuestoData: {
        ordenId: number;
        estadoId: number;
        descripcion?: string;
    }) => {
        try {
            const newPresupuesto = await apiRequest<Presupuesto>(
                '/presupuestos',
                {
                    method: 'POST',
                    body: JSON.stringify(presupuestoData),
                },
                session,
            );
            //toast.success("Presupuesto creado exitosamente");
            return newPresupuesto;
        } catch (error) {
            //console.error("Error al crear presupuesto:", error);
            toast.error(error instanceof Error ? error.message : "Error al crear presupuesto");
            throw error;
        }
    };

    const updatePresupuesto = async (
        id: number,
        presupuestoData: {
            ordenId?: number;
            estadoId?: number;
            descripcion?: string;
        }
    ) => {
        try {
            if (!session?.accessToken) throw new Error("Token no disponible");

            // Validar que el estadoId existe si se está actualizando
            if (presupuestoData.estadoId !== undefined) {
                const estadoExiste = estados?.some(e => e.id === presupuestoData.estadoId);
                if (!estadoExiste) {
                    throw new Error("El estado seleccionado no es válido");
                }
            }

            const updatedPresupuesto = await apiRequest<Presupuesto>(
                `/presupuestos/${id}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(presupuestoData),
                },
                session,
            );

            // Asegurar que el estado viene completo
            if (presupuestoData.estadoId && estados) {
                updatedPresupuesto.estado = estados.find(e => e.id === presupuestoData.estadoId);
            }

            // Actualizar la lista de presupuestos
            setPresupuestos(prev => prev.map(p =>
                p.id === id ? { ...p, ...updatedPresupuesto } : p
            ));

            // Actualizar también el presupuesto individual si es el mismo
            setPresupuesto(prev => prev?.id === id ? updatedPresupuesto : prev);

            toast.success("Presupuesto actualizado exitosamente");
            return updatedPresupuesto;
        } catch (error) {
            //console.error("Error al actualizar presupuesto:", error);
            toast.error(error instanceof Error ? error.message : "Error al actualizar presupuesto");
            throw error;
        }
    };


    const deletePresupuesto = async (id: number) => {
        try {
            await apiRequest<void>(
                `/presupuestos/${id}`,
                {
                    method: 'DELETE',
                },
                session,
            );
            toast.success("Presupuesto eliminado exitosamente");
            return { success: true };
        } catch (error) {
            //console.error("Error al eliminar presupuesto:", error);
            toast.error(error instanceof Error ? error.message : "Error al eliminar presupuesto");
            throw error;
        }
    };

    const restorePresupuesto = async (id: number) => {
        try {
            await apiRequest<void>(
                `/presupuestos/${id}/restore`,
                {
                    method: 'PATCH',
                },
                session,
            );

            toast.success("Presupuesto restaurado exitosamente");
            return true;
        } catch (error) {
            //console.error("Error al restaurar presupuesto:", error);
            toast.error(error instanceof Error ? error.message : "Error al restaurar presupuesto");
            throw error;
        }
    };

    const getResumenPresupuesto = async (id: number): Promise<ResumenPresupuesto> => {
        try {
            setLoading(true);

            const data = await apiRequest<ResumenPresupuesto>(`/presupuestos/${id}/resumen`, {}, session);
            return data;
        } catch (error) {
            //console.error("Error al obtener resumen de presupuesto:", error);
            toast.error(error instanceof Error ? error.message : "Error al cargar resumen");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalPresupuesto = async (id: number) => {
        try {
            const resumen = await getResumenPresupuesto(id);
            return {
                totalItems: resumen.costoItems,
                totalManoObra: resumen.costoManoObra,
                total: resumen.costoTotal,
                success: true
            };
        } catch (error) {
            return {
                totalItems: 0,
                totalManoObra: 0,
                total: 0,
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    };

    //Presupuesto por orden
    const getPresupuestoByOrderId = async (orderId: number): Promise<{ presupuesto: Presupuesto, resumen: ResumenPresupuesto }> => {
        try {
            setLoading(true);

            if (!session?.accessToken) throw new Error("Token de sesión no disponible");

            // Primero obtenemos el presupuesto asociado a la orden
            const presupuestos = await apiRequest<Presupuesto[]>(
                `/presupuestos?ordenId=${orderId}`,
                {},
                session,
            );
            const presupuesto = presupuestos[0]; // Asumimos que solo hay un presupuesto activo por orden

            if (!presupuesto) {
                throw new Error("No se encontró presupuesto para esta orden");
            }

            // Luego obtenemos el resumen
            const resumen = await getResumenPresupuesto(presupuesto.id);

            return { presupuesto, resumen };
        } catch (error) {
            //console.error("Error al obtener presupuesto por orderId:", error);
            toast.error(error instanceof Error ? error.message : "Error al cargar presupuesto");
            throw error;
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (status === "authenticated") {
            fetchPresupuestos(1, 10, searchTerm, showInactive);
        }
    }, [status, session, searchTerm, showInactive]);

    return {
        presupuestos,
        presupuesto,
        loading,
        totalPages,
        totalItems,
        currentPage,
        searchTerm,
        showInactive,
        fetchPresupuestos,
        fetchPresupuestoById,
        createPresupuesto,
        updatePresupuesto,
        deletePresupuesto,
        restorePresupuesto,
        getResumenPresupuesto,
        getPresupuestoByOrderId,
        calculateTotalPresupuesto,
        setSearchTerm,
        setShowInactive,
    };
}