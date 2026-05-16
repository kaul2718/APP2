'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

// Interfaces para tipos de datos
export interface UserBasic {
    id: number;
    nombre: string;
    apellido?: string;
    role: string;
}

export interface EvidenciaTecnica {
    id: number;
    ordenId: number;
    subidoPor: UserBasic;
    estadoOrden?: {
        id: number;
        nombre: string;
    };
    archivoUrl: string;
    tipoArchivo: 'imagen' | 'video';
    descripcion?: string;
    fechaSubida: string;
    deletedAt?: string;
}

interface ApiResponse {
    success: boolean;
    data?: EvidenciaTecnica | EvidenciaTecnica[];
    message?: string;
    total?: number;
    page?: number;
    limit?: number;
}

export function useEvidenciaTecnica(initialOrdenId?: number) {
    const { data: session, status } = useSession();
    const [evidencias, setEvidencias] = useState<EvidenciaTecnica[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [ordenIdFilter, setOrdenIdFilter] = useState<number | undefined>(initialOrdenId);
    const [totalPages, setTotalPages] = useState<number>(1);

    const handleApiError = useCallback((error: unknown, defaultMessage: string) => {
        console.error("Error en API:", error);
        const message = error instanceof Error ? error.message : defaultMessage;
        toast.error(message);
        throw new Error(message);
    }, []);

    // Sincronizar el filtro con el ID inicial y limpiar estado al cambiar de orden
    useEffect(() => {
        setOrdenIdFilter(initialOrdenId);
        setEvidencias([]); // Limpiar evidencias anteriores al cambiar de orden
        setCurrentPage(1);  // Resetear a la primera página
        setTotalItems(0);   // Reiniciar contador
        setTotalPages(1);   // Reiniciar páginas
    }, [initialOrdenId]);

    const fetchEvidencias = useCallback(async (
        ordenId?: number,
        page: number = currentPage,
        limit: number = itemsPerPage
    ) => {
        try {
            setLoading(true);
            setOrdenIdFilter(ordenId);

            if (!session?.accessToken) {
                throw new Error("No hay sesión activa");
            }

            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());

            if (ordenId) {
                params.append('ordenId', ordenId.toString());
            }

            const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/evidencias-tecnicas?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Error ${response.status}`);
            }

            const result: ApiResponse = await response.json();

            if (!result.success || !result.data) {
                throw new Error(result.message || "Formato de respuesta inválido");
            }

            const dataArray = Array.isArray(result.data) ? result.data : [result.data];

            setEvidencias(dataArray);
            setTotalItems(result.total || 0);
            setCurrentPage(result.page || 1);
            setItemsPerPage(result.limit || limit);
            setTotalPages(Math.ceil((result.total || 1) / (result.limit || limit)));

            return {
                items: dataArray,
                total: result.total || 0,
                page: result.page || 1,
                limit: result.limit || limit,
                totalPages: Math.ceil((result.total || 1) / (result.limit || limit))
            };
        } catch (error) {
            handleApiError(error, "Error al cargar evidencias");
            return {
                items: [],
                total: 0,
                page: 1,
                limit: itemsPerPage,
                totalPages: 1
            };
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken, currentPage, itemsPerPage, handleApiError]);

    const createEvidencia = useCallback(
        async (ordenId: number, archivo: File, descripcion?: string) => {
            try {
                setUploading(true);

                if (!session?.accessToken || !session.user?.id) {
                    throw new Error("No hay sesión activa");
                }

                // Validación del archivo
                const validTypes = [
                    "image/jpeg", "image/png", "image/gif",
                    "video/mp4", "video/quicktime", "video/x-msvideo",
                ];

                if (!validTypes.includes(archivo.type)) {
                    throw new Error(
                        "Tipo de archivo no soportado. Use imágenes (JPEG, PNG, GIF) o videos (MP4, MOV, AVI)"
                    );
                }

                if (archivo.size > 10 * 1024 * 1024) {
                    throw new Error("El archivo es demasiado grande (máximo 10MB)");
                }

                const formData = new FormData();
                formData.append("archivo", archivo); // ← archivo físico para @UploadedFile
                formData.append("ordenId", String(ordenId));
                formData.append("subidoPorId", String(session.user.id));
                if (descripcion) formData.append("descripcion", descripcion);

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/evidencias-tecnicas`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                            // NO PONER Content-Type aquí → lo gestiona el navegador con boundary
                        },
                        body: formData,
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.message || `Error ${response.status}`);
                }

                const responseText = await response.text();

                let result: ApiResponse;
                try {
                    result = JSON.parse(responseText);
                } catch (jsonError) {
                    throw new Error("Respuesta JSON inválida del backend");
                }

                if (!result.success || !result.data) {
                    throw new Error(result.message || "Error al crear evidencia");
                }

                toast.success(" Evidencia creada exitosamente");

                // Refrescar evidencias sin perder la paginación
                await fetchEvidencias(ordenId, currentPage, itemsPerPage);

                return result.data as EvidenciaTecnica;
            } catch (error) {
                handleApiError(error, "Error al crear evidencia");
                throw error;
            } finally {
                setUploading(false);
            }
        },
        [session, handleApiError, fetchEvidencias, ordenIdFilter, currentPage, itemsPerPage]
    );



    const updateEvidencia = useCallback(async (
        id: number,
        updateData: { descripcion?: string; archivo?: File }
    ) => {
        try {
            setUploading(true);

            if (!session?.accessToken) {
                throw new Error("No hay sesión activa");
            }

            // Validación del archivo si se proporciona
            if (updateData.archivo) {
                if (updateData.archivo.size > 10 * 1024 * 1024) {
                    throw new Error("El archivo es demasiado grande (máximo 10MB)");
                }
            }

            const formData = new FormData();
            if (updateData.descripcion) {
                formData.append('descripcion', updateData.descripcion);
            }
            if (updateData.archivo) {
                formData.append('archivo', updateData.archivo);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/evidencias-tecnicas/${id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Error ${response.status}`);
            }

            const result: ApiResponse = await response.json();

            if (!result.success || !result.data) {
                throw new Error(result.message || "Error al actualizar evidencia");
            }

            toast.success("Evidencia actualizada exitosamente");

            // Actualizar el estado local sin recargar
            setEvidencias(prev => prev.map(ev =>
                ev.id === id ? { ...ev, ...result.data } : ev
            ));

            return result.data as EvidenciaTecnica;
        } catch (error) {
            handleApiError(error, "Error al actualizar evidencia");
            throw error;
        } finally {
            setUploading(false);
        }
    }, [session?.accessToken, handleApiError]);

    const deleteEvidencia = useCallback(async (id: number) => {
        try {
            setLoading(true);

            if (!session?.accessToken) {
                throw new Error("No hay sesión activa");
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/evidencias-tecnicas/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Error ${response.status}`);
            }

            const result: ApiResponse = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Error al eliminar evidencia");
            }

            toast.success("Evidencia eliminada exitosamente");

            // 🔥 Actualiza el estado local directamente
            setEvidencias(prev => prev.filter(ev => ev.id !== id));

            // También puedes actualizar totalItems si quieres
            setTotalItems(prev => prev - 1);

            return true;
        } catch (error) {
            handleApiError(error, "Error al eliminar evidencia");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken, handleApiError]);


    // Cargar evidencias al cambiar filtros, página o autenticación
    useEffect(() => {
        if (status === "authenticated") {
            const abortController = new AbortController();

            fetchEvidencias(ordenIdFilter, currentPage, itemsPerPage)
                .catch(error => {
                    if (error.name !== 'AbortError') {
                        handleApiError(error, "Error al cargar evidencias");
                    }
                });

            return () => abortController.abort();
        }
    }, [status, fetchEvidencias, ordenIdFilter, currentPage, itemsPerPage, handleApiError]);

    // Función para cambiar de página
    const goToPage = useCallback((page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    }, [totalPages]);

    return {
        evidencias,
        loading,
        uploading,
        totalItems,
        currentPage,
        totalPages,
        itemsPerPage,
        ordenIdFilter,
        fetchEvidencias,
        createEvidencia,
        updateEvidencia,
        deleteEvidencia,
        setOrdenIdFilter,
        setItemsPerPage,
        goToPage
    };
}