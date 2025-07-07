'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface Presupuesto {
    id: number;
    ordenId: number;
    estadoId: number;
    descripcion: string | null;
    fechaEmision: string;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    orden?: Order;
    estado?: EstadoPresupuesto;
    detallesManoObra?: DetalleManoObra[];
    detallesRepuestos?: DetalleRepuesto[];
}

export interface Order {
    id: number;
    workOrderNumber: string;
    clientId: number;
    equipoId: number;
}

export interface EstadoPresupuesto {
    id: number;
    nombre: string;
    descripcion: string | null;
}

export interface DetalleManoObra {
    id: number;
    tipoManoObraId: number;
    cantidad: number;
    costoUnitario: number;
    costoTotal: number;
}

export interface DetalleRepuesto {
    id: number;
    repuestoId: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

interface PaginatedPresupuestoResponse {
    items?: Presupuesto[]; // Hacerlo opcional
    data?: Presupuesto[];  // Alternativa común
    presupuestos?: Presupuesto[]; // Otra alternativa
    totalItems?: number;
    totalPages?: number;
    currentPage?: number;
    // Cualquier otro campo que devuelva tu API
}

interface ResumenPresupuesto {
    presupuestoId: number;
    descripcion: string | null;
    fechaEmision: string;
    orden: {
        numeroOrden: string;
        clienteId: number;
        equipoId: number;
    };
    detalleManoObra: {
        tipo: string;
        cantidad: number;
        costoUnitario: number;
        costoTotal: number;
    }[];
    detalleRepuestos: {
        nombre: string;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
    }[];
    costoManoObra: number;
    costoRepuestos: number;
    costoTotal: number;
}

export function usePresupuesto() {
    const { data: session, status } = useSession();
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>("");

    const fetchPresupuestos = async (
        page: number = 1,
        limit: number = 1000,
        search: string = ""
    ) => {
        try {
            setLoading(true);

            if (!session?.accessToken) {
                throw new Error("Token de sesión no disponible");
            }

            let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/presupuestos?page=${page}&limit=${limit}`;

            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();

            // Modificación importante aquí:
            // Verifica si la respuesta es un array directo o si tiene estructura paginada
            if (Array.isArray(data)) {
                // Si la respuesta es un array directo
                setPresupuestos(data);
                setTotalPages(1);
                setTotalItems(data.length);
                setCurrentPage(1);
            } else if (data.items && Array.isArray(data.items)) {
                // Si la respuesta tiene estructura paginada
                setPresupuestos(data.items);
                setTotalPages(data.totalPages);
                setTotalItems(data.totalItems);
                setCurrentPage(data.currentPage);
            } else {
                throw new Error("Formato de respuesta inválido");
            }
        } catch (error) {
            console.error("Error al obtener presupuestos:", error);
            toast.error(error instanceof Error ? error.message : "Error al cargar presupuestos");
            setPresupuestos([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPresupuestoById = async (id: number) => {
        try {
            setLoading(true);

            if (!session?.accessToken) {
                throw new Error("Token de sesión no disponible");
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/presupuestos/${id}`, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error al obtener presupuesto:", error);
            toast.error(error instanceof Error ? error.message : "Error al cargar presupuesto");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const fetchPresupuestosByOrder = async (ordenId: number) => {
        try {
            setLoading(true);

            if (!session?.accessToken) {
                throw new Error("Token de sesión no disponible");
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/presupuestos/by-orden/${ordenId}`,
                {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data: Presupuesto[] = await response.json();
            return data;
        } catch (error) {
            console.error("Error al obtener presupuestos por orden:", error);
            toast.error(error instanceof Error ? error.message : "Error al cargar presupuestos");
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/presupuestos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(presupuestoData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            const newPresupuesto = await response.json();
            toast.success("Presupuesto creado exitosamente");
            return newPresupuesto;
        } catch (error) {
            console.error("Error al crear presupuesto:", error);
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/presupuestos/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(presupuestoData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            const updatedPresupuesto = await response.json();
            toast.success("Presupuesto actualizado exitosamente");
            return updatedPresupuesto;
        } catch (error) {
            console.error("Error al actualizar presupuesto:", error);
            toast.error(error instanceof Error ? error.message : "Error al actualizar presupuesto");
            throw error;
        }
    };

    const deletePresupuesto = async (id: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/presupuestos/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            toast.success("Presupuesto eliminado exitosamente");
            return true;
        } catch (error) {
            console.error("Error al eliminar presupuesto:", error);
            toast.error(error instanceof Error ? error.message : "Error al eliminar presupuesto");
            throw error;
        }
    };

    const restorePresupuesto = async (id: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/presupuestos/${id}/restore`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            toast.success("Presupuesto restaurado exitosamente");
            return true;
        } catch (error) {
            console.error("Error al restaurar presupuesto:", error);
            toast.error(error instanceof Error ? error.message : "Error al restaurar presupuesto");
            throw error;
        }
    };

    const getResumenPresupuesto = async (id: number): Promise<ResumenPresupuesto> => {
        try {
            if (!session?.accessToken) {
                throw new Error("Token de sesión no disponible");
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/presupuestos/${id}/resumen`,
                {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error al obtener resumen del presupuesto:", error);
            toast.error(error instanceof Error ? error.message : "Error al cargar resumen");
            throw error;
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchPresupuestos(1, 1000, searchTerm);
        }
    }, [status, session, searchTerm]);

    return {
        presupuestos,
        loading,
        totalPages,
        totalItems,
        currentPage,
        searchTerm,
        fetchPresupuestos,
        fetchPresupuestoById,
        fetchPresupuestosByOrder,
        createPresupuesto,
        updatePresupuesto,
        deletePresupuesto,
        restorePresupuesto,
        getResumenPresupuesto,
        setPresupuestos,
        setSearchTerm,
    };
}