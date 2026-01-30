'use client';
import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useActividadTecnica } from "@/hooks/useActividadTecnica";
import { DocumentTextIcon, WrenchScrewdriverIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    orderId: number;
    orderNumber?: string;
}

export default function ActividadesPorOrdenModal({
    isOpen,
    onClose,
    orderId,
    orderNumber
}: Props) {
    const { fetchActividadesByOrder } = useActividadTecnica();
    const [actividades, setActividades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarActividades = async () => {
        try {
            setLoading(true);
            const data = await fetchActividadesByOrder(orderId);
            setActividades(data || []);
        } catch (error) {
            toast.error("Error al cargar actividades técnicas");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && orderId) {
            cargarActividades();
        }
    }, [isOpen, orderId]);

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-2xl"
            title={`Actividades Técnicas - Orden #${orderNumber || orderId}`}
            closeButtonClassName="top-4 right-4"
        >
            <div className="px-4 py-2 max-h-[65vh] overflow-y-auto">
                {loading ? (
                    <div className="text-center py-4">
                        <p>Cargando actividades...</p>
                    </div>
                ) : actividades.length === 0 ? (
                    <div className="text-center py-4">
                        <p>No se encontraron actividades técnicas</p>
                    </div>
                ) : (

                    <div className="space-y-4">
                        <div className="px-6 pt-4 pb-2">
                            <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
                                Lista de Actividades
                            </h3>
                        </div>
                        {actividades.map((actividad) => (
                            <div key={actividad.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                                <div className="flex items-start mb-2">
                                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {formatDate(actividad.createdAt)}
                                    </span>
                                </div>

                                <div className="mb-2">
                                    <p className="font-medium text-gray-800 dark:text-white">
                                        {actividad.tipoActividad?.nombre || 'Tipo no especificado'}
                                    </p>
                                </div>

                                <div className="flex items-start mb-2">
                                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Diagnóstico:</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-200">
                                            {actividad.diagnostico}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trabajo realizado:</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-200">
                                            {actividad.trabajoRealizado}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4 flex justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-1/2 sm:w-auto min-w-[140px]"
                    >
                        Cerrar
                    </Button>
                </div>

            </div>
        </Modal>
    );
}