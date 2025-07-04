'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export interface Categoria {
    id: number;
    nombre: string;
    descripcion: string;
    estado: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// Respuesta paginada del backend
interface PaginatedCategoriaResponse {
    items: Categoria[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
}

export function useCategoria() {
    const { data: session, status } = useSession();
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showInactive, setShowInactive] = useState<boolean>(false);

    const fetchCategorias = async (
        page: number = 1,
        limit: number = 10,
        search: string = "",
        includeInactive: boolean = false
    ) => {
        try {
            setLoading(true);

            if (!session?.accessToken) {
                throw new Error("Token de sesión no disponible");
            }

            let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/categorias/all?page=${page}&limit=${limit}`;

            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }

            if (includeInactive) {
                url += `&includeInactive=true`;
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data: PaginatedCategoriaResponse = await response.json();

            if (!data.items || !Array.isArray(data.items)) {
                throw new Error("Formato de respuesta inválido");
            }

            setCategorias(data.items);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
            setCurrentPage(data.currentPage);
        } catch (error) {
            console.error("Error al obtener categorías:", error);
            toast.error(error instanceof Error ? error.message : "Error al cargar categorías");
            setCategorias([]);
        } finally {
            setLoading(false);
        }
    };

    const createCategoria = async (categoriaData: { nombre: string; descripcion: string }) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/categorias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(categoriaData),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const newCategoria = await response.json();
            toast.success("Categoría creada exitosamente");
            return newCategoria;
        } catch (error) {
            console.error("Error al crear categoría:", error);
            toast.error(error instanceof Error ? error.message : "Error al crear categoría");
            throw error;
        }
    };

    const updateCategoria = async (id: number, categoriaData: { nombre?: string; descripcion?: string; estado?: boolean }) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/categorias/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(categoriaData),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const updatedCategoria = await response.json();
            toast.success("Categoría actualizada exitosamente");
            return updatedCategoria;
        } catch (error) {
            console.error("Error al actualizar categoría:", error);
            toast.error(error instanceof Error ? error.message : "Error al actualizar categoría");
            throw error;
        }
    };

    const toggleCategoriaStatus = async (id: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/categorias/${id}/toggle-estado`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const updatedCategoria = await response.json();
            toast.success(`Categoría ${updatedCategoria.estado ? 'activada' : 'desactivada'} exitosamente`);
            return updatedCategoria;
        } catch (error) {
            console.error("Error al cambiar estado de la categoría:", error);
            toast.error(error instanceof Error ? error.message : "Error al cambiar estado de la categoría");
            throw error;
        }
    };

    const deleteCategoria = async (id: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/categorias/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            toast.success("Categoría eliminada exitosamente");
            return true;
        } catch (error) {
            console.error("Error al eliminar categoría:", error);
            toast.error(error instanceof Error ? error.message : "Error al eliminar categoría");
            throw error;
        }
    };

    const restoreCategoria = async (id: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/categorias/${id}/restore`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            toast.success("Categoría restaurada exitosamente");
            return true;
        } catch (error) {
            console.error("Error al restaurar categoría:", error);
            toast.error(error instanceof Error ? error.message : "Error al restaurar categoría");
            throw error;
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchCategorias(1, 10, searchTerm, showInactive);
        }
    }, [status, session, searchTerm, showInactive]);

    return {
        categorias,
        loading,
        totalPages,
        totalItems,
        currentPage,
        searchTerm,
        showInactive,
        fetchCategorias,
        createCategoria,
        updateCategoria,
        toggleCategoriaStatus,
        deleteCategoria,
        restoreCategoria,
        setCategorias,
        setSearchTerm,
        setShowInactive,
    };
}