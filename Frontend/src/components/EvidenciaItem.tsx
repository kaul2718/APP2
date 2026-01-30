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
                    <Button
                        variant="danger"
                        size="sm"
                        className="absolute top-2 right-2 p-2"
                        onClick={() => onDelete(evidencia.id)}
                        aria-label="Eliminar evidencia"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </Button>
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
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(evidencia.fechaSubida).toLocaleDateString()} - 
                    {new Date(evidencia.fechaSubida).toLocaleTimeString()}
                </p>
                
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