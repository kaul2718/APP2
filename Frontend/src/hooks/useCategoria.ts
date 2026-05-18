'use client';
 
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";

export interface Categoria {
    id: number;
    nombre: string;
    descripcion: string;
    estado: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

interface CreateCategoriaDto {
    nombre: string;
    descripcion: string;
}

interface UpdateCategoriaDto {
    nombre?: string;
    descripcion?: string;
    estado?: boolean;
}

export function useCategoria(autoFetch: boolean = true) {
    const { data: session, status } = useSession();
    const {
        items: categorias,
        loading,
        totalPages,
        totalItems,
        currentPage,
        searchTerm,
        showInactive,
        fetchItems,
        createItem,
        updateItem,
        toggleItemStatus,
        deleteItem,
        restoreItem,
        setItems: setCategorias,
        setSearchTerm,
        setShowInactive,
    } = useCrud<Categoria, CreateCategoriaDto, UpdateCategoriaDto>(
        '/categorias',
        {
            defaultLimit: 10,
            listPath: '/categorias/all',
            messages: {
                created: 'Categoría creada exitosamente',
                updated: 'Categoría actualizada exitosamente',
                deleted: 'Categoría eliminada exitosamente',
                restored: 'Categoría restaurada exitosamente',
                toggled: (enabled) =>
                    `Categoría ${enabled ? 'activada' : 'desactivada'} exitosamente`,
                loadError: 'Error al cargar categorías',
                createError: 'Error al crear categoría',
                updateError: 'Error al actualizar categoría',
                deleteError: 'Error al eliminar categoría',
                restoreError: 'Error al restaurar categoría',
                toggleError: 'Error al cambiar estado de la categoría',
            },
        },
    );

    const fetchCategorias = fetchItems;
    const createCategoria = createItem;
    const updateCategoria = updateItem;
    const toggleCategoriaStatus = toggleItemStatus;
    const deleteCategoria = deleteItem;
    const restoreCategoria = restoreItem;

    useEffect(() => {
        if (autoFetch && status === "authenticated") {
            fetchCategorias(1, 10, searchTerm, showInactive);
        }
    }, [status, session, searchTerm, showInactive, autoFetch]);

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