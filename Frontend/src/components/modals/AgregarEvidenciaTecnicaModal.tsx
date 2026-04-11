'use client';
import React, { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { CameraIcon, PhotoIcon, VideoCameraIcon, XMarkIcon, ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useEvidenciaTecnica } from "@/hooks/useEvidenciaTecnica";
import TextArea from "@/components/form/input/TextArea";
import EvidenciaItem from "../EvidenciaItem";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    orderId: number;
    
}

export default function EvidenciaTecnicaModal({
    isOpen,
    onClose,
    onSuccess,
    orderId
}: Props) {
    const [descripcion, setDescripcion] = useState("");
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [fileType, setFileType] = useState<"imagen" | "video">("imagen");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);

    const [errors, setErrors] = useState({
        file: "",
        descripcion: ""
    });
    const [activeTab, setActiveTab] = useState<'agregar' | 'ver'>('ver');

    const { data: session } = useSession();
    const {
        evidencias,
        loading,
        uploading,
        totalItems,
        currentPage,
        totalPages,
        itemsPerPage,
        fetchEvidencias,
        createEvidencia,
        deleteEvidencia,
        goToPage,
        setItemsPerPage
    } = useEvidenciaTecnica();

    useEffect(() => {
        if (isOpen && orderId) {
            fetchEvidencias(orderId);
        }
    }, [isOpen, orderId, currentPage, itemsPerPage]);

    const stopCamera = () => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((track) => track.stop());
            cameraStreamRef.current = null;
        }
        setIsCameraOpen(false);
        setCameraReady(false);
    };

    useEffect(() => {
        if (!isOpen) {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const setFileData = (file: File) => {
        setSelectedFile(file);
        const type = file.type.startsWith("image") ? "imagen" : "video";
        setFileType(type);

        const reader = new FileReader();
        reader.onload = () => {
            setFilePreview(reader.result as string);
            setErrors((prev) => ({ ...prev, file: "" }));
        };
        reader.readAsDataURL(file);
    };

    const waitForVideoReady = async (video: HTMLVideoElement, timeoutMs: number = 2500): Promise<boolean> => {
        const startedAt = Date.now();

        return new Promise((resolve) => {
            const checkReady = () => {
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                    resolve(true);
                    return;
                }

                if (Date.now() - startedAt >= timeoutMs) {
                    resolve(false);
                    return;
                }

                requestAnimationFrame(checkReady);
            };

            checkReady();
        });
    };

    useEffect(() => {
        let cancelled = false;

        const attachStreamToVideo = async () => {
            if (!isCameraOpen || !cameraStreamRef.current || !videoRef.current) {
                return;
            }

            try {
                const video = videoRef.current;
                if (!video) return;

                video.srcObject = cameraStreamRef.current;
                await video.play();

                const ready = await waitForVideoReady(video, 3000);
                if (!cancelled) {
                    setCameraReady(ready);
                    if (!ready) {
                        setCameraError("La cámara tardó demasiado en iniciar. Inténtalo de nuevo.");
                    }
                }
            } catch (error) {
                if (!cancelled) {
                    setCameraError("No se pudo inicializar la vista de la cámara.");
                    setCameraReady(false);
                }
            }
        };

        attachStreamToVideo();

        return () => {
            cancelled = true;
        };
    }, [isCameraOpen]);

    const openCamera = async () => {
        if (!navigator?.mediaDevices?.getUserMedia) {
            setCameraError("Tu navegador no soporta acceso directo a cámara.");
            return;
        }

        try {
            setCameraError(null);
            setCameraReady(false);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
                audio: false,
            });

            cameraStreamRef.current = stream;
            setIsCameraOpen(true);
        } catch (error) {
            setCameraError("No se pudo abrir la cámara. Revisa permisos del navegador.");
        }
    };

    const capturePhoto = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            toast.error("No se pudo capturar la foto");
            return;
        }

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) {
            const ready = await waitForVideoReady(video, 2000);
            if (!ready) {
                toast.error("La cámara aún no está lista");
                return;
            }
        }

        const readyWidth = video.videoWidth;
        const readyHeight = video.videoHeight;

        canvas.width = readyWidth;
        canvas.height = readyHeight;

        const context = canvas.getContext("2d");
        if (!context) {
            toast.error("No se pudo procesar la imagen");
            return;
        }

        context.drawImage(video, 0, 0, readyWidth, readyHeight);

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", 0.9);
        });

        if (!blob) {
            toast.error("No se pudo generar la foto");
            return;
        }

        const capturedFile = new File([blob], `evidencia-${Date.now()}.jpg`, {
            type: "image/jpeg",
        });

        setFileData(capturedFile);
        stopCamera();
    };

    const resetForm = () => {
        stopCamera();
        setDescripcion("");
        setFilePreview(null);
        setSelectedFile(null); // <- limpiar aquí
        setCameraError(null);
        setCameraReady(false);
        setErrors({ file: "", descripcion: "" });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


    const handleClose = () => {
        resetForm();
        setActiveTab('ver');
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamaño
        if (file.size > 10 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, file: "El archivo no debe exceder 10MB" }));
            return;
        }

        setFileData(file);
    };


    const removeFile = () => {
        stopCamera();
        setFilePreview(null);
        setSelectedFile(null);    // ← agregar
        setCameraError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const validateFields = () => {
        const newErrors = {
            file: !filePreview ? "Debe seleccionar un archivo" : "",
            descripcion: descripcion.length > 200 ? "La descripcion no debe exceder 200 caracteres" : ""
        };

        setErrors(newErrors);
        return !newErrors.file && !newErrors.descripcion;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validamos que haya un archivo y una sesión
        if (!selectedFile) {
            toast.error('No se ha seleccionado ningun archivo');
            return;
        }
        if (!session?.user?.id) {
            toast.error('No hay sesion activa');
            return;
        }

        try {
            // Llamada única a createEvidencia con el selectedFile de estado
            await createEvidencia(orderId, selectedFile, descripcion);
            //toast.success("Evidencia técnica agregada exitosamente");
            resetForm();
            setActiveTab('ver');
            onSuccess?.();
        } catch (error) {
            //console.error("Error en el modal:", error);
            // El handleApiError de tu hook ya mostrará el toast correspondiente
        }
    };

    const handleDeleteEvidencia = async (id: number) => {
        try {
            await deleteEvidencia(id);
            //toast.success("Evidencia eliminada correctamente");
        } catch (error) {
            //console.error("Error al eliminar evidencia:", error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Evidencia tecnica"
            className="max-w-4xl mx-4"
        >
            <div className="flex flex-col h-full">
                <div className="px-6 pt-4 pb-2 border-b dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
                        Evidencia Técnica
                    </h2>

                    <div className="flex justify-center mt-4">
                        <div className="inline-flex rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={() => setActiveTab('ver')}
                                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${activeTab === 'ver' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                            >
                                Ver Evidencias ({totalItems})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('agregar')}
                                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${activeTab === 'agregar' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                            >
                                Agregar Nueva
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'agregar' ? (
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-6 py-4">
                            <div className="grid grid-cols-1 gap-y-4">
                                {/* Previsualización del archivo */}
                                <div className="mb-4">
                                    <Label htmlFor="evidencia-file-input" className="mb-2 block">Archivo <span aria-hidden="true">*</span></Label>

                                    {filePreview ? (
                                        <div className="relative group">
                                            {fileType === "imagen" ? (
                                                <img
                                                    src={filePreview}
                                                    alt="Preview"
                                                    className="w-full h-64 object-contain rounded-lg border border-gray-300 dark:border-gray-600"
                                                />
                                            ) : (
                                                <video
                                                    src={filePreview}
                                                    controls
                                                    className="w-full h-64 object-contain rounded-lg border border-gray-300 dark:border-gray-600"
                                                />
                                            )}
                                            <button
                                                type="button"
                                                onClick={removeFile}
                                                className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Eliminar archivo"
                                            >
                                                <XMarkIcon className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                    ) : isCameraOpen ? (
                                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                onLoadedMetadata={() => setCameraReady(true)}
                                                className="w-full h-64 object-cover rounded-lg bg-black"
                                            />
                                            <canvas ref={canvasRef} className="hidden" />
                                            <div className="mt-3 flex justify-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    onClick={capturePhoto}
                                                    disabled={!cameraReady}
                                                    className="flex items-center gap-2"
                                                >
                                                    <CameraIcon className="w-4 h-4" />
                                                    {cameraReady ? "Capturar" : "Iniciando cámara..."}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={stopCamera}
                                                >
                                                    Cancelar cámara
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center"
                                            aria-label="Área para seleccionar o capturar evidencias"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <CameraIcon className="w-10 h-10 text-gray-400" />
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    Selecciona cómo quieres agregar la evidencia
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Formatos soportados: JPG, PNG, GIF, MP4, MOV, AVI (max 10MB)
                                                </p>
                                                <div className="mt-3 flex flex-wrap justify-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={openCamera}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <CameraIcon className="w-4 h-4" />
                                                        Tomar foto
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <PhotoIcon className="w-4 h-4" />
                                                        Subir archivo
                                                    </Button>
                                                </div>
                                            </div>
                                            <input
                                                id="evidencia-file-input"
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*, video/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                aria-label="Selector de archivos"
                                            />
                                        </div>
                                    )}
                                    {cameraError && (
                                        <p role="alert" className="text-sm text-red-500 mt-1">{cameraError}</p>
                                    )}
                                    {errors.file && (
                                        <p role="alert" className="text-sm text-red-500 mt-1">{errors.file}</p>
                                    )}
                                </div>

                                {/* Descripción */}
                                <div className="mb-4">
                                    <Label htmlFor="descripcion-evidencia">Descripcion (opcional)</Label>
                                    <TextArea
                                        id="descripcion-evidencia"
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        placeholder="Describa la evidencia..."
                                        rows={3}
                                        error={Boolean(errors.descripcion)}
                                        hint={errors.descripcion}
                                        maxLength={200}
                                        aria-label="Descripción de la evidencia"
                                    />
                                    <div className="text-right text-xs text-gray-500 mt-1">
                                        {descripcion.length}/200 caracteres
                                    </div>
                                    {errors.descripcion && (
                                        <p role="alert" className="text-sm text-red-500 mt-1">{errors.descripcion}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p className="px-6 pb-2 text-xs text-gray-500 dark:text-gray-400">* Campo obligatorio</p>

                        <div className="flex justify-end gap-4 mt-4 px-6 pb-6 border-t dark:border-gray-700 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveTab('ver')}
                                disabled={uploading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={!filePreview || uploading}
                                loading={uploading}
                                className="flex items-center gap-2"
                            >
                                {fileType === "imagen" ? (
                                    <PhotoIcon className="w-5 h-5" />
                                ) : (
                                    <VideoCameraIcon className="w-5 h-5" />
                                )}
                                Subir Evidencia
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col flex-1">
                        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-6 py-4">
                            {loading ? (
                                <div className="flex justify-center items-center h-40">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : evidencias.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">No hay evidencias técnicas registradas</p>
                                    <Button
                                        variant="primary"
                                        className="mt-4"
                                        onClick={() => setActiveTab('agregar')}
                                    >
                                        Agregar Primera Evidencia
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {evidencias.map(evidencia => (
                                        <EvidenciaItem
                                            key={evidencia.id}
                                            evidencia={evidencia}
                                            onDelete={handleDeleteEvidencia}
                                            currentUserId={session?.user?.id}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {evidencias.length > 0 && (
                            <div className="flex items-center justify-between px-6 pb-6 border-t dark:border-gray-700 pt-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        Mostrando {(currentPage - 1) * itemsPerPage + 1} -
                                        {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
                                    </span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="text-sm border rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
                                    >
                                        <option value={5}>5 por página</option>
                                        <option value={10}>10 por página</option>
                                        <option value={20}>20 por página</option>
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1"
                                    >
                                        <ArrowLeftIcon className="w-4 h-4" />
                                    </Button>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "primary" : "outline"}
                                                onClick={() => goToPage(pageNum)}
                                                className="px-3 py-1 min-w-[40px]"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}

                                    <Button
                                        variant="outline"
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1"
                                    >
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </Button>
                                </div>

                                <Button
                                    variant="primary"
                                    onClick={() => setActiveTab('agregar')}
                                    className="ml-4"
                                >
                                    Agregar Nueva
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}