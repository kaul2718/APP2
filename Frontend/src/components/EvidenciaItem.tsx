import React from "react";
import { EvidenciaTecnica } from "@/hooks/useEvidenciaTecnica";
import { PhotoIcon, VideoCameraIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/button/Button";

interface EvidenciaItemProps {
    evidencia: EvidenciaTecnica;
    onDelete: (id: number) => void;
    currentUserId?: number;
}

const EvidenciaItem: React.FC<EvidenciaItemProps> = ({ 
    evidencia, 
    onDelete,
    currentUserId
}) => {
    const isOwner = currentUserId === evidencia.subidoPor.id;
    const isImage = evidencia.tipoArchivo === 'imagen';

    return (
        <div className="border rounded-lg overflow-hidden dark:border-gray-700">
            <div className="relative bg-gray-100 dark:bg-gray-800 h-48">
                {isImage ? (
                    <img
                        src={evidencia.archivoUrl}
                        alt={`Evidencia técnica ${evidencia.id}`}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <video
                        src={evidencia.archivoUrl}
                        controls
                        className="w-full h-full object-contain"
                    />
                )}
                
                {isOwner && (
                    <button
                        className="absolute top-2 right-2 rounded-full bg-red-100 p-2 text-red-600 shadow-sm transition-colors hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900/80"
                        onClick={() => onDelete(evidencia.id)}
                        title="Eliminar evidencia"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    {isImage ? (
                        <PhotoIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                        <VideoCameraIcon className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Subido por: {evidencia.subidoPor.nombre} {evidencia.subidoPor.apellido}
                    </span>
                </div>
                
                <div className="flex flex-col gap-1 mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(evidencia.fechaSubida).toLocaleDateString()} - {new Date(evidencia.fechaSubida).toLocaleTimeString()}
                    </p>
                    {evidencia.estadoOrden && (
                        <div className="inline-flex w-fit items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-900/50">
                            Etapa: {evidencia.estadoOrden.nombre}
                        </div>
                    )}
                </div>
                
                {evidencia.descripcion && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {evidencia.descripcion}
                    </p>
                )}
            </div>
        </div>
    );
};

export default EvidenciaItem;