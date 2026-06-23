'use client';

import React, { useState } from "react";
import { useChecklistTemplate } from "@/hooks/useChecklistTemplate";
import { useTipoEquipo } from "@/hooks/useTipoEquipo";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { ChecklistTemplate } from "@/types/checklist.types";
import { TrashIcon, PlusIcon, ClipboardDocumentListIcon, TagIcon, SquaresPlusIcon } from "@heroicons/react/24/outline";

interface Props {
    onSuccess?: () => void;
    template?: ChecklistTemplate;
}

export default function IngresarChecklistTemplateForm({ onSuccess, template }: Props) {
    const { createTemplate, updateTemplate } = useChecklistTemplate();
    const { tiposEquipo } = useTipoEquipo();
    const [nombre, setNombre] = useState(template?.nombre || "");
    const [tipoEquipoId, setTipoEquipoId] = useState<number>(template?.tipoEquipo?.id || 0);
    const [items, setItems] = useState<string[]>(template?.items || ["Enciende", "Imagen", "Teclado", "Touchpad", "Batería"]);
    const [newItem, setNewItem] = useState("");

    const nameInputId = React.useId();
    const tipoEquipoSelectId = React.useId();
    const newItemInputId = React.useId();

    // Verificar si hay cambios respecto a los datos originales
    const hasChanges = React.useMemo(() => {
        if (!template) return true; // Si es creación siempre se permite
        
        const nombreChanged = nombre !== template.nombre;
        const tipoEquipoChanged = tipoEquipoId !== template.tipoEquipo?.id;
        
        // Comparar arreglos de items
        const itemsChanged = items.length !== template.items.length || 
                           items.some((item, index) => item !== template.items[index]);

        return nombreChanged || tipoEquipoChanged || itemsChanged;
    }, [template, nombre, tipoEquipoId, items]);

    const handleAddItem = () => {
        if (newItem.trim()) {
            if (!items.includes(newItem.trim())) {
                setItems([...items, newItem.trim()]);
            }
            setNewItem("");
        }
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre || !tipoEquipoId || items.length === 0) return;

        if (template) {
            await updateTemplate(template.id, {
                nombre,
                tipoEquipoId,
                items,
            });
        } else {
            await createTemplate({
                nombre,
                tipoEquipoId,
                items,
            });
        }

        if (onSuccess) onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre de la Plantilla */}
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

                {/* Tipo de Equipo */}
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
                        <option value={0}>Selecciona un tipo...</option>
                        {tiposEquipo.map((tipo) => (
                            <option key={tipo.id} value={tipo.id}>
                                {tipo.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sección de Ítems */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                    <label htmlFor={newItemInputId} className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <SquaresPlusIcon className="w-4 h-4 text-brand-500" />
                        Puntos de Revisión
                    </label>
                    <span className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {items.length} ítems definidos
                    </span>
                </div>

                <div className="flex gap-2 group">
                    <div className="relative flex-grow">
                        <Input
                            id={newItemInputId}
                            placeholder="Agregar nuevo punto (Ej: Puerto HDMI, Batería...)"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 pr-10"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                           <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-500 dark:text-gray-400 font-sans">
                               Enter
                           </kbd>
                        </div>
                    </div>
                    <Button 
                        type="button" 
                        onClick={handleAddItem} 
                        className="bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 px-4"
                        aria-label="Agregar punto de revisión"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </Button>
                </div>

                {/* Lista de Ítems (Chips) */}
                <div className="flex flex-wrap gap-2 min-h-[100px] p-3 bg-white dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    {items.length > 0 ? (
                        items.map((item, index) => (
                            <div 
                                key={index} 
                                className="group flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 pl-3 pr-1.5 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:border-brand-300 dark:hover:border-brand-500/50 transition-all animate-in fade-in zoom-in duration-200"
                            >
                                <span>{item}</span>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    aria-label={`Eliminar punto de revisión: ${item}`}
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center w-full py-4 text-gray-400 space-y-1">
                            <ClipboardDocumentListIcon className="w-8 h-8 opacity-20" />
                            <p className="text-xs italic">Aún no has agregado puntos de revisión</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer con acciones */}
            <div className="flex justify-end pt-2">
                <Button 
                    type="submit" 
                    disabled={!hasChanges || !nombre || !tipoEquipoId || items.length === 0}
                    className={`w-full sm:w-auto min-w-[200px] h-12 text-base shadow-lg transition-all ${
                        !hasChanges 
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
