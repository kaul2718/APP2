'use client';

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useCrud } from "@/hooks/useCrud";
import { ChecklistTemplate, ChecklistTemplateItems } from "@/types/checklist.types";
import { apiRequest } from "@/lib/api";

export interface CreateChecklistTemplateDto {
    nombre: string;
    tipoEquipoId: number;
    items: ChecklistTemplateItems;
    estado?: boolean;
}

export interface UpdateChecklistTemplateDto {
    nombre?: string;
    tipoEquipoId?: number;
    items?: ChecklistTemplateItems;
    estado?: boolean;
}

export function useChecklistTemplate() {
    const { data: session, status } = useSession();
    const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
    const [loadingTemplate, setLoadingTemplate] = useState(false);

    const {
        items: templates,
        loading,
        fetchItems,
        createItem,
        updateItem,
        toggleItemStatus,
        deleteItem,
        setSearchTerm,
        setShowInactive,
        totalPages,
        totalItems,
        currentPage,
        showInactive,
        searchTerm,
    } = useCrud<ChecklistTemplate, CreateChecklistTemplateDto, UpdateChecklistTemplateDto>(
        '/checklist-template',
        {
            defaultLimit: 10,
            messages: {
                created: 'Plantilla creada exitosamente',
                updated: 'Plantilla actualizada exitosamente',
                deleted: 'Plantilla eliminada exitosamente',
                loadError: 'Error al cargar plantillas',
                createError: 'Error al crear plantilla',
                updateError: 'Error al actualizar plantilla',
                deleteError: 'Error al eliminar plantilla',
            },
        },
    );

    const fetchTemplates = fetchItems;
    const createTemplate = createItem;
    const updateTemplate = updateItem;
    const deleteTemplate = deleteItem;
    const toggleTemplateStatus = toggleItemStatus;

    const getTemplateByTipoEquipo = useCallback(async (tipoEquipoId: number) => {
        if (!tipoEquipoId) {
            setSelectedTemplate(null);
            return null;
        }

        setLoadingTemplate(true);
        try {
            const data = await apiRequest<ChecklistTemplate>(
                `/checklist-template/tipo-equipo/${tipoEquipoId}`,
                {},
                session,
            );
            setSelectedTemplate(data);
            return data;
        } catch (error: any) {
            if (error?.status === 404) {
                // Comportamiento esperado cuando no hay plantilla activa para ese tipo de equipo
                setSelectedTemplate(null);
                return null;
            }
            // Error real de red, autenticación o servidor (500, 401, 403, ECONNREFUSED...)
            console.error('Error al obtener plantilla por tipo de equipo:', error);
            toast.error(
                `Error al consultar plantilla técnica (${error?.status || 'Conexión'}): ${
                    error?.message || 'Fallo de comunicación con el servidor'
                }`,
            );
            setSelectedTemplate(null);
            throw error;
        } finally {
            setLoadingTemplate(false);
        }
    }, [session]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchTemplates(1, 10, "", false);
        }
    }, [status, session]);

    return {
        templates,
        loading,
        loadingTemplate,
        selectedTemplate,
        fetchTemplates,
        createTemplate,
        updateTemplate,
        toggleTemplateStatus,
        deleteTemplate,
        getTemplateByTipoEquipo,
        setSearchTerm,
        setShowInactive,
        totalPages,
        totalItems,
        currentPage,
        showInactive,
        searchTerm,
    };
}
