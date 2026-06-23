'use client';

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useCrud } from "@/hooks/useCrud";
import { ChecklistTemplate } from "@/types/checklist.types";
import { apiRequest } from "@/lib/api";

interface CreateChecklistTemplateDto {
    nombre: string;
    tipoEquipoId: number;
    items: string[];
}

interface UpdateChecklistTemplateDto {
    nombre?: string;
    tipoEquipoId?: number;
    items?: string[];
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
        deleteItem,
        setSearchTerm,
        setShowInactive,
    } = useCrud<ChecklistTemplate, CreateChecklistTemplateDto, UpdateChecklistTemplateDto>(
        '/checklist-template',
        {
            defaultLimit: 100,
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

    const getTemplateByTipoEquipo = React.useCallback(async (tipoEquipoId: number) => {
        setLoadingTemplate(true);
        try {
            // First check if we have it in our locally loaded templates
            const localTemplate = templates.find(t => t.tipoEquipoId === tipoEquipoId);
            if (localTemplate) {
                setSelectedTemplate(localTemplate);
                return localTemplate;
            }

            const data = await apiRequest<ChecklistTemplate>(`/checklist-template/tipo-equipo/${tipoEquipoId}`, {}, session);
            setSelectedTemplate(data);
            return data;
        } catch (error: any) {
            if (error?.status === 404) {
                console.log(`No hay plantilla para el tipo de equipo ${tipoEquipoId}`);
            } else {
                console.error('Error al obtener plantilla por tipo de equipo:', error);
            }
            setSelectedTemplate(null);
            return null;
        } finally {
            setLoadingTemplate(false);
        }
    }, [session, templates]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchTemplates(1, 100, "", false);
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
        deleteTemplate,
        getTemplateByTipoEquipo,
        setSearchTerm,
        setShowInactive,
    };
}
