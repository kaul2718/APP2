'use client';

import React, { useState, useMemo } from "react";
import { useChecklistTemplate } from "@/hooks/useChecklistTemplate";
import { useTipoEquipo } from "@/hooks/useTipoEquipo";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { ChecklistTemplate, normalizeTemplateItems } from "@/types/checklist.types";
import {
    TrashIcon,
    PlusIcon,
    ClipboardDocumentListIcon,
    TagIcon,
    WrenchScrewdriverIcon,
    CpuChipIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

interface Props {
    onSuccess?: () => void;
    template?: ChecklistTemplate;
}

export default function IngresarChecklistTemplateForm({ onSuccess, template }: Props) {
    const { createTemplate, updateTemplate } = useChecklistTemplate();
    const { tiposEquipo } = useTipoEquipo();

    const [nombre, setNombre] = useState(template?.nombre || "");
    const [tipoEquipoId, setTipoEquipoId] = useState<number>(
        template?.tipoEquipo?.id || template?.tipoEquipoId || 0
    );
    const [estado, setEstado] = useState<boolean>(
        template?.estado !== undefined ? template.estado : true
    );

    // Separación explícita de inspección física y funcional
    const initialItems = useMemo(() => {
        if (!template?.items) {
            return {
                fisica: [
                    "Carcasa exterior y tapas",
                    "Pantalla / Cristal / Bisel",
                    "Teclado físico y puertos",
                ],
                funcional: [
                    "Encendido / Secuencia POST",
                    "Salida de video / Display",
                    "Conectividad de red",
                ],
            };
        }
        return normalizeTemplateItems(template.items);
    }, [template]);

    const [itemsFisicos, setItemsFisicos] = useState<string[]>(initialItems.fisica);
    const [itemsFuncionales, setItemsFuncionales] = useState<string[]>(initialItems.funcional);

    const [newFisico, setNewFisico] = useState("");
    const [newFuncional, setNewFuncional] = useState("");
    const [activeTab, setActiveTab] = useState<'fisica' | 'funcional'>('fisica');

    const nameInputId = React.useId();
    const tipoEquipoSelectId = React.useId();
    const newFisicoInputId = React.useId();
    const newFuncionalInputId = React.useId();

    // Detección de cambios
    const hasChanges = useMemo(() => {
        if (!template) return true;

        const nombreChanged = nombre !== template.nombre;
        const tipoEquipoChanged = tipoEquipoId !== (template.tipoEquipo?.id || template.tipoEquipoId);
        const estadoChanged = estado !== template.estado;

        const original = normalizeTemplateItems(template.items);

        const fisicosChanged =
            itemsFisicos.length !== original.fisica.length ||
            itemsFisicos.some((item, i) => item !== original.fisica[i]);

        const funcionalesChanged =
            itemsFuncionales.length !== original.funcional.length ||
            itemsFuncionales.some((item, i) => item !== original.funcional[i]);

        return nombreChanged || tipoEquipoChanged || estadoChanged || fisicosChanged || funcionalesChanged;
    }, [template, nombre, tipoEquipoId, estado, itemsFisicos, itemsFuncionales]);

    // Gestión de Ítems Físicos
    const handleAddFisico = () => {
        const val = newFisico.trim();
        if (val && !itemsFisicos.includes(val)) {
            setItemsFisicos([...itemsFisicos, val]);
            setNewFisico("");
        }
    };

    const handleRemoveFisico = (index: number) => {
        setItemsFisicos(itemsFisicos.filter((_, i) => i !== index));
    };

    const handleMoveFisico = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= itemsFisicos.length) return;
        const updated = [...itemsFisicos];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        setItemsFisicos(updated);
    };

    // Gestión de Ítems Funcionales
    const handleAddFuncional = () => {
        const val = newFuncional.trim();
        if (val && !itemsFuncionales.includes(val)) {
            setItemsFuncionales([...itemsFuncionales, val]);
            setNewFuncional("");
        }
    };

    const handleRemoveFuncional = (index: number) => {
        setItemsFuncionales(itemsFuncionales.filter((_, i) => i !== index));
    };

    const handleMoveFuncional = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= itemsFuncionales.length) return;
        const updated = [...itemsFuncionales];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        setItemsFuncionales(updated);
    };

    const totalPuntos = itemsFisicos.length + itemsFuncionales.length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || !tipoEquipoId || totalPuntos === 0) return;

        const payloadItems = {
            fisica: itemsFisicos,
            funcional: itemsFuncionales,
        };

        if (template) {
            await updateTemplate(template.id, {
                nombre: nombre.trim(),
                tipoEquipoId,
                estado,
                items: payloadItems,
            });
        } else {
            await createTemplate({
                nombre: nombre.trim(),
                tipoEquipoId,
                estado,
                items: payloadItems,
            });
        }

        if (onSuccess) onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fila 1: Nombre y Tipo de Equipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label htmlFor={nameInputId} className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <ClipboardDocumentListIcon className="w-4 h-4 text-brand-500" />
                        Nombre de la Plantilla
                    </label>
                    <Input
                        id={nameInputId}
                        placeholder="Ej: Laptop - Peritaje Completo"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                        className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-brand-500"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor={tipoEquipoSelectId} className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <TagIcon className="w-4 h-4 text-brand-500" />
                        Tipo de Equipo
                    </label>
                    <select
                        id={tipoEquipoSelectId}
                        className="w-full h-[46px] rounded-lg border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800/50 dark:text-white focus:border-brand-500 focus:ring-brand-500 transition-all outline-none"
                        value={tipoEquipoId}
                        onChange={(e) => setTipoEquipoId(Number(e.target.value))}
                        required
                    >
                        <option value={0}>Selecciona un tipo de equipo...</option>
                        {tiposEquipo.map((tipo) => (
                            <option key={tipo.id} value={tipo.id}>
                                {tipo.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Fila 2: Control de Estado Activo/Inactivo */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    {estado ? (
                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                    ) : (
                        <XCircleIcon className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Estado de la plantilla
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {estado
                                ? "Activa (se utilizará automáticamente en órdenes completas del equipo)"
                                : "Inactiva (no se ofrecerá para nuevas órdenes)"}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setEstado(!estado)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        estado ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    role="switch"
                    aria-checked={estado}
                    aria-label="Alternar estado de plantilla"
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            estado ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                </button>
            </div>

            {/* Fila 3: Tabs de Inspección Física vs Funcional */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('fisica')}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'fisica'
                                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                        >
                            <WrenchScrewdriverIcon className="w-4 h-4 text-amber-500" />
                            <span>Inspección Física</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-bold">
                                {itemsFisicos.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('funcional')}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'funcional'
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                        >
                            <CpuChipIcon className="w-4 h-4 text-blue-500" />
                            <span>Inspección Funcional</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 font-bold">
                                {itemsFuncionales.length}
                            </span>
                        </button>
                    </div>

                    <span className="text-xs text-gray-400 font-medium">
                        Total: {totalPuntos} preguntas
                    </span>
                </div>

                {/* Panel Inspección Física */}
                {activeTab === 'fisica' && (
                    <div className="space-y-3 bg-gray-50/50 dark:bg-gray-800/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <Input
                                    id={newFisicoInputId}
                                    placeholder="Agregar punto físico (Ej: Bisagras, Pantalla, Carcasa, Puertos...)"
                                    value={newFisico}
                                    onChange={(e) => setNewFisico(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFisico())}
                                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleAddFisico}
                                className="bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 px-4"
                                aria-label="Agregar punto de inspección física"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Lista Reordenable Física */}
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {itemsFisicos.length > 0 ? (
                                itemsFisicos.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                                                {index + 1}
                                            </span>
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {item}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleMoveFisico(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                aria-label="Subir posición"
                                            >
                                                <ChevronUpIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMoveFisico(index, 'down')}
                                                disabled={index === itemsFisicos.length - 1}
                                                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                aria-label="Bajar posición"
                                            >
                                                <ChevronDownIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFisico(index)}
                                                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                aria-label="Eliminar punto físico"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-center py-6 text-gray-400 italic">
                                    No hay puntos físicos agregados aún. Escribe arriba para agregar uno.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Panel Inspección Funcional */}
                {activeTab === 'funcional' && (
                    <div className="space-y-3 bg-gray-50/50 dark:bg-gray-800/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <Input
                                    id={newFuncionalInputId}
                                    placeholder="Agregar prueba funcional (Ej: Encendido / POST, Video, Batería, WiFi...)"
                                    value={newFuncional}
                                    onChange={(e) => setNewFuncional(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFuncional())}
                                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleAddFuncional}
                                className="bg-blue-500 hover:bg-blue-600 shadow-md shadow-blue-500/20 px-4"
                                aria-label="Agregar prueba funcional"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Lista Reordenable Funcional */}
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {itemsFuncionales.length > 0 ? (
                                itemsFuncionales.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                                                {index + 1}
                                            </span>
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {item}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleMoveFuncional(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                aria-label="Subir posición"
                                            >
                                                <ChevronUpIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMoveFuncional(index, 'down')}
                                                disabled={index === itemsFuncionales.length - 1}
                                                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                aria-label="Bajar posición"
                                            >
                                                <ChevronDownIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFuncional(index)}
                                                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                aria-label="Eliminar prueba funcional"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-center py-6 text-gray-400 italic">
                                    No hay pruebas funcionales agregadas aún. Escribe arriba para agregar una.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer con Acciones */}
            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button 
                    type="submit" 
                    disabled={!hasChanges || !nombre.trim() || !tipoEquipoId || totalPuntos === 0}
                    className={`w-full sm:w-auto min-w-[200px] h-11 text-sm font-semibold shadow-lg transition-all ${
                        !hasChanges || !nombre.trim() || !tipoEquipoId || totalPuntos === 0
                        ? "opacity-50 cursor-not-allowed grayscale" 
                        : "shadow-brand-500/20 active:scale-95"
                    }`}
                >
                    {template ? "Actualizar Plantilla" : "Guardar Nueva Plantilla"}
                </Button>
            </div>
        </form>
    );
}
