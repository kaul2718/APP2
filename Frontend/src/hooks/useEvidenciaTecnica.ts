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

export const MAX_EVIDENCE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export function resolveMimeType(file: { name: string; type?: string }): string {
    const ext = file.name?.split(".").pop()?.toLowerCase() || "";
    const rawMime = (file.type || "").split(";")[0].trim().toLowerCase();

    // Mapeo prioritario por extensión conocida para evitar discrepancias en móviles (.mov sin MIME o con codecs)
    switch (ext) {
        case "mp4":
        case "m4v":
            return "video/mp4";
        case "mov":
            return "video/quicktime";
        case "webm":
            return "video/webm";
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "png":
            return "image/png";
        case "webp":
            return "image/webp";
        case "gif":
            return "image/gif";
        case "heic":
            return "image/heic";
        case "heif":
            return "image/heif";
    }

    if (rawMime) {
        if (rawMime === "video/x-m4v") return "video/mp4";
        if (rawMime === "image/jpg") return "image/jpeg";
        return rawMime;
    }

    return "application/octet-stream";
}

export interface EvidenceFileValidation {
    valid: boolean;
    isVideo: boolean;
    isHeic: boolean;
    mimeType: string;
    error?: string;
}

export function validateEvidenceFile(file: {
    name: string;
    size: number;
    type?: string;
}): EvidenceFileValidation {
    if (!file || typeof file.size !== "number" || file.size <= 0) {
        return {
            valid: false,
            isVideo: false,
            isHeic: false,
            mimeType: "application/octet-stream",
            error: "El archivo seleccionado está vacío o es inválido.",
        };
    }

    if (file.size > MAX_EVIDENCE_SIZE_BYTES) {
        return {
            valid: false,
            isVideo: false,
            isHeic: false,
            mimeType: resolveMimeType(file),
            error: "El archivo excede el límite máximo permitido de 100MB.",
        };
    }

    const lowerName = (file.name || "").toLowerCase();
    const ext = lowerName.includes(".") ? lowerName.split(".").pop() || "" : "";
    const mimeType = resolveMimeType(file);

    const allowedVideoExts = ["mp4", "m4v", "mov", "webm"];
    const allowedVideoMimes = ["video/mp4", "video/quicktime", "video/webm"];
    const unsupportedVideoExts = ["avi", "mkv", "wmv", "flv", "3gp", "mpeg", "mpg"];

    if (unsupportedVideoExts.includes(ext) || mimeType === "video/x-msvideo" || mimeType === "video/x-matroska") {
        return {
            valid: false,
            isVideo: true,
            isHeic: false,
            mimeType,
            error: "Formato de video no soportado. Use MP4, MOV o WebM (máximo 100MB).",
        };
    }

    const isVideo = allowedVideoExts.includes(ext) || allowedVideoMimes.includes(mimeType);
    if (isVideo) {
        if (ext && !allowedVideoExts.includes(ext)) {
            return {
                valid: false,
                isVideo: true,
                isHeic: false,
                mimeType,
                error: "Formato de video no soportado. Use MP4, MOV o WebM (máximo 100MB).",
            };
        }
        return {
            valid: true,
            isVideo: true,
            isHeic: false,
            mimeType: allowedVideoMimes.includes(mimeType) ? mimeType : "video/mp4",
        };
    }

    const allowedImageExts = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];
    const allowedImageMimes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/heic",
        "image/heif",
    ];
    const isHeic = ext === "heic" || ext === "heif" || mimeType === "image/heic" || mimeType === "image/heif";
    const isImage = allowedImageExts.includes(ext) || allowedImageMimes.includes(mimeType);

    if (isImage) {
        if (ext && !allowedImageExts.includes(ext)) {
            return {
                valid: false,
                isVideo: false,
                isHeic: false,
                mimeType,
                error: "Formato de imagen no soportado. Use JPG, PNG, WebP o HEIC (máximo 100MB).",
            };
        }
        return {
            valid: true,
            isVideo: false,
            isHeic,
            mimeType: allowedImageMimes.includes(mimeType) ? mimeType : "image/jpeg",
        };
    }

    return {
        valid: false,
        isVideo: false,
        isHeic: false,
        mimeType,
        error: "Formato de archivo no soportado. Use imágenes (JPG, PNG, WebP, HEIC) o videos (MP4, MOV, WebM) de hasta 100MB.",
    };
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
                const responseXml = xhr.responseText || "";
                if (responseXml.includes("Request has expired")) {
                    reject(
                        new Error(
                            "La autorización de subida (URL prefirmada) ha expirado. Por favor intenta subir el archivo nuevamente."
                        )
                    );
                } else if (responseXml.includes("SignatureDoesNotMatch")) {
                    reject(
                        new Error(
                            "Error de firma S3/R2 (403 SignatureDoesNotMatch): el Content-Type o los parámetros de la solicitud no coinciden con la firma."
                        )
                    );
                } else {
                    reject(
                        new Error(
                            "Acceso denegado (403) por Cloudflare R2: La URL prefirmada ha expirado o las cabeceras no coinciden con la firma."
                        )
                    );
                }
            } else if (xhr.status === 400) {
                reject(
                    new Error(
                        "Solicitud rechazada por Cloudflare R2 (400 Bad Request): verifique la integridad o formato del archivo."
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
            const corsErr = new Error(
                "Error de conexión o bloqueo CORS al subir a Cloudflare R2. Verifique que la política CORS del bucket permita este origen y método PUT."
            ) as Error & { isCorsOrNetworkError?: boolean };
            corsErr.isCorsOrNetworkError = true;
            reject(corsErr);
        };

        xhr.ontimeout = () => {
            reject(new Error("Tiempo de espera agotado al transferir el archivo a Cloudflare R2."));
        };

        xhr.send(file);
    });
}

function uploadFormDataWithProgress(
    url: string,
    formData: FormData,
    accessToken: string,
    onProgress: (percent: number) => void
): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            let parsed: any = null;
            try {
                parsed = JSON.parse(xhr.responseText);
            } catch {
                parsed = null;
            }
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(parsed);
            } else {
                reject(new Error(parsed?.message || `Error ${xhr.status} al subir evidencia al servidor`));
            }
        };

        xhr.onerror = () => {
            reject(new Error("Error de red al transferir el archivo al servidor. Verifique su conexión a internet."));
        };

        xhr.ontimeout = () => {
            reject(new Error("Tiempo de espera agotado durante la subida del archivo."));
        };

        xhr.send(formData);
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

                // Validación estricta del archivo (formato y límite de 100MB)
                const validation = validateEvidenceFile(archivo);
                if (!validation.valid) {
                    throw new Error(
                        validation.error ||
                            "Formato de archivo no soportado. Use imágenes (JPG, PNG, WebP, HEIC) o videos (MP4, MOV, WebM) de hasta 100MB."
                    );
                }

                const { isVideo } = validation;
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

                const uploadViaBackendMultipart = async (): Promise<EvidenciaTecnica> => {
                    setUploadProgress(0);
                    const formData = new FormData();
                    formData.append("archivo", fileToUpload);
                    formData.append("ordenId", String(ordenId));
                    formData.append("subidoPorId", String(session.user.id));
                    if (descripcion) formData.append("descripcion", descripcion);
                    if (options?.highDetailMode) formData.append("highDetailMode", "true");

                    const result = await uploadFormDataWithProgress(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/evidencias-tecnicas`,
                        formData,
                        session.accessToken as string,
                        (percent) => setUploadProgress(percent)
                    );

                    if (!result?.success || !result?.data) {
                        throw new Error(result?.message || "Error al crear evidencia");
                    }

                    return result.data as EvidenciaTecnica;
                };

                // Videos y archivos > 10MB utilizan subida directa prefirmada a Cloudflare R2 con respaldo automático
                if (isVideo || fileToUpload.size > 10 * 1024 * 1024) {
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
                    const { uploadUrl, storageKey, mimeType: signedMimeType } = presignedResult.data;
                    const finalMimeType = signedMimeType || uploadMime;

                    try {
                        // 2. Subir directamente a Cloudflare R2 con seguimiento de progreso
                        await uploadFileWithProgress(uploadUrl, fileToUpload, finalMimeType, (percent) => {
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
                                    mimeType: finalMimeType,
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
                    } catch (putError: any) {
                        // Si el navegador bloquea el PUT directo por política CORS pendiente en el bucket o proxy móvil,
                        // transferir a través del backend hacia R2 sin duplicar registros (confirm-upload no fue invocado).
                        if (putError?.isCorsOrNetworkError) {
                            console.warn(
                                "[R2 Direct Upload] PUT directo bloqueado por CORS/red; transfiriendo a R2 mediante el servidor backend..."
                            );
                            createdData = await uploadViaBackendMultipart();
                        } else {
                            throw putError;
                        }
                    }
                } else {
                    // Subida estándar vía NestJS para fotos optimizadas / archivos menores o iguales a 10MB
                    createdData = await uploadViaBackendMultipart();
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

            // Validación del archivo si se proporciona (hasta 100MB)
            if (updateData.archivo) {
                const validation = validateEvidenceFile(updateData.archivo);
                if (!validation.valid) {
                    throw new Error(validation.error || "El archivo es inválido o excede el límite de 100MB");
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