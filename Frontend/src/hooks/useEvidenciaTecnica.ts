'use client';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { optimizeImageClient, ImageOptimizationResult, formatBytes } from "@/utils/imageOptimizer";

// Interfaces para tipos de datos
export interface UserBasic {
    id: number;
    nombre: string;
    apellido?: string;
    role: string;
}

export function resolveMimeType(file: File): string {
    if (file.type && file.type.trim() !== "") {
        return file.type;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "mp4":
            return "video/mp4";
        case "mov":
            return "video/quicktime";
        case "webm":
            return "video/webm";
        case "mkv":
            return "video/x-matroska";
        case "avi":
            return "video/x-msvideo";
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "png":
            return "image/png";
        case "webp":
            return "image/webp";
        default:
            return "application/octet-stream";
    }
}

function uploadFileWithProgress(
    url: string,
    file: File,
    mimeType: string,
    onProgress: (percent: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", mimeType);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else if (xhr.status === 403) {
                reject(
                    new Error(
                        "Acceso denegado (403) por Cloudflare R2: La URL prefirmada ha expirado o las cabeceras no coinciden con la firma."
                    )
                );
            } else {
                reject(
                    new Error(
                        `Error al transferir archivo a Cloudflare R2 (${xhr.status}: ${xhr.statusText || "Error del servidor"})`
                    )
                );
            }
        };

        xhr.onerror = () => {
            reject(
                new Error(
                    "Error de conexión o bloqueo CORS al subir a Cloudflare R2. Verifique que la política CORS del bucket permita este origen y método PUT."
                )
            );
        };

        xhr.ontimeout = () => {
            reject(new Error("Tiempo de espera agotado al transferir el archivo a Cloudflare R2."));
        };

        xhr.send(file);
    });
}

export interface EvidenciaTecnica {
    id: number;
    ordenId: number;
    subidoPor: UserBasic;
    estadoOrden?: {
        id: number;
        nombre: string;
    };
    storageKey?: string;
    nombreOriginal?: string;
    mimeType?: string;
    tamanoBytes?: number;
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
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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
        async (
            ordenId: number,
            archivo: File,
            descripcion?: string,
            options?: {
                highDetailMode?: boolean;
                onOptimizationComplete?: (result: ImageOptimizationResult) => void;
            }
        ) => {
            try {
                setUploading(true);

                if (!session?.accessToken || !session.user?.id) {
                    throw new Error("No hay sesión activa");
                }

                // Validación del archivo
                const validTypes = [
                    "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif",
                    "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
                ];
                const resolvedInitialMime = resolveMimeType(archivo);
                const lowerName = archivo.name.toLowerCase();
                const isHeic = lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
                const isVideo =
                    resolvedInitialMime.startsWith('video') ||
                    ['.mp4', '.mov', '.avi', '.webm', '.mkv'].some((ext) => lowerName.endsWith(ext));

                if (!validTypes.includes(resolvedInitialMime) && !isHeic && !isVideo) {
                    throw new Error(
                        "Tipo de archivo no soportado. Use imágenes (JPEG, PNG, WebP, HEIC) o videos (MP4, MOV, WebM)"
                    );
                }

                // Límite de tamaño: hasta 100MB
                if (archivo.size > 100 * 1024 * 1024) {
                    throw new Error("El archivo excede el límite máximo permitido de 100MB");
                }

                let fileToUpload: File = archivo;

                // Si es imagen, optimizar inteligentemente en el cliente
                if (!isVideo) {
                    try {
                        const opt = await optimizeImageClient(archivo, {
                            highDetailMode: options?.highDetailMode,
                            maxOriginalSizeMB: 100,
                        });
                        fileToUpload = opt.file;
                        options?.onOptimizationComplete?.(opt);
                        if (opt.wasOptimized) {
                            console.log(
                                `[Optimizador] Reducción: ${formatBytes(opt.originalSize)} -> ${formatBytes(opt.optimizedSize)} (-${opt.compressionRatio}%)`
                            );
                        }
                    } catch (optErr) {
                        console.warn("[Optimizador] Falló procesamiento en navegador, enviando original al backend:", optErr);
                    }
                }

                let createdData: EvidenciaTecnica;
                const uploadMime = resolveMimeType(fileToUpload);

                // Si el archivo final supera 10MB (ej. videos pesados), usar subida directa prefirmada a Cloudflare R2
                if (fileToUpload.size > 10 * 1024 * 1024) {
                    setUploadProgress(0);

                    // 1. Solicitar URL prefirmada
                    const presignedRes = await fetch(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/evidencias-tecnicas/presigned-upload`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${session.accessToken}`,
                            },
                            body: JSON.stringify({
                                ordenId,
                                fileName: fileToUpload.name,
                                mimeType: uploadMime,
                                fileSize: fileToUpload.size,
                            }),
                        }
                    );

                    if (!presignedRes.ok) {
                        const err = await presignedRes.json().catch(() => null);
                        throw new Error(err?.message || "Error solicitando autorización de subida a R2");
                    }

                    const presignedResult = await presignedRes.json();
                    const { uploadUrl, storageKey } = presignedResult.data;

                    // 2. Subir directamente a Cloudflare R2 con seguimiento de progreso
                    await uploadFileWithProgress(uploadUrl, fileToUpload, uploadMime, (percent) => {
                        setUploadProgress(percent);
                    });

                    // 3. Confirmar subida y registrar en base de datos
                    const confirmRes = await fetch(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/evidencias-tecnicas/confirm-upload`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${session.accessToken}`,
                            },
                            body: JSON.stringify({
                                ordenId,
                                storageKey,
                                nombreOriginal: archivo.name,
                                mimeType: uploadMime,
                                tamanoBytes: fileToUpload.size,
                                descripcion,
                            }),
                        }
                    );

                    if (!confirmRes.ok) {
                        const err = await confirmRes.json().catch(() => null);
                        throw new Error(err?.message || "Error confirmando registro de evidencia");
                    }

                    const confirmResult = await confirmRes.json();
                    createdData = confirmResult.data;
                } else {
                    // Subida estándar vía NestJS para fotos optimizadas / archivos menores o iguales a 10MB
                    const formData = new FormData();
                    formData.append("archivo", fileToUpload);
                    formData.append("ordenId", String(ordenId));
                    formData.append("subidoPorId", String(session.user.id));
                    if (descripcion) formData.append("descripcion", descripcion);
                    if (options?.highDetailMode) formData.append("highDetailMode", "true");

                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/evidencias-tecnicas`,
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${session.accessToken}`,
                            },
                            body: formData,
                        }
                    );

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => null);
                        throw new Error(errorData?.message || `Error ${response.status}`);
                    }

                    const result: ApiResponse = await response.json();
                    if (!result.success || !result.data) {
                        throw new Error(result.message || "Error al crear evidencia");
                    }

                    createdData = result.data as EvidenciaTecnica;
                }

                toast.success("Evidencia técnica almacenada exitosamente en Cloudflare R2");
                await fetchEvidencias(ordenId, currentPage, itemsPerPage);
                return createdData;
            } catch (error) {
                handleApiError(error, "Error al crear evidencia");
                throw error;
            } finally {
                setUploading(false);
                setUploadProgress(null);
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
        uploadProgress,
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