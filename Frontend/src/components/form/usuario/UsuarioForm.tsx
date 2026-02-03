"use client";

import React from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useUsuarioForm } from "./useUsuarioForm";
import { UsuarioFormData, UsuarioFormMode } from "./types";
import { useRoles } from "@/hooks/useRoles";
import {
    UserIcon,
    IdentificationIcon,
    EnvelopeIcon,
    PhoneIcon,
    HomeIcon,
    MapIcon,
    LockClosedIcon,
} from "@heroicons/react/24/outline";

interface UsuarioFormProps {
    mode: UsuarioFormMode;
    initialData?: UsuarioFormData;
    onSubmit: (data: UsuarioFormData, camposModificados?: Set<string>) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
    isModal?: boolean;
}

export default function UsuarioForm({
    mode,
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    isModal = false,
}: UsuarioFormProps) {
    const { formData, errors, handleChange, validateFields, camposModificados } =
        useUsuarioForm({ initialData, mode });
    const { roles } = useRoles();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateFields()) {
            return;
        }

        await onSubmit(formData, camposModificados);
    };

    const formatRoleName = (role: string): string => {
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    const isEditMode = mode === "edit";
    const showModifiedIndicator = isEditMode && camposModificados.size > 0;

    return (
        <form onSubmit={handleSubmit} className={isModal ? "" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
            {isModal && (
                <div className="custom-scrollbar h-[500px] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                        {renderFormFields()}
                    </div>
                </div>
            )}

            {!isModal && renderFormFields()}

            {/* Submit Buttons */}
            <div className={isModal ? "flex justify-end gap-4 mt-6" : "md:col-span-2 flex gap-4"}>                
                <Button
                    type="submit"
                    disabled={isLoading || (isEditMode && camposModificados.size === 0)}
                    loading={isLoading}
                    className={!isModal ? "w-full" : ""}
                >
                    {isEditMode ? "Guardar Cambios" : "Registrar Usuario"}
                </Button>
            </div>
        </form>
    );

    function renderFormFields() {
        return (
            <>
                {/* ID - Solo en edit mode */}
                {isEditMode && formData.id && (
                    <div>
                        <Label>ID</Label>
                        <Input name="id" value={formData.id} disabled />
                    </div>
                )}

                {/* Cédula */}
                <div>
                    <Label>Cédula {!isEditMode && "*"}</Label>
                    <div className="relative">
                        <IdentificationIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            value={formData.cedula}
                            onChange={(e) => handleChange("cedula", e.target.value)}
                            placeholder="Ej: 1234567890"
                            maxLength={10}
                            disabled={isLoading}
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.cedula && (
                        <p className="text-sm text-red-500 mt-1">{errors.cedula}</p>
                    )}
                    {isEditMode && camposModificados.has("cedula") && (
                        <ModifiedIndicator field="cédula" />
                    )}
                </div>

                {/* Nombre */}
                <div>
                    <Label>Nombre *</Label>
                    <div className="relative">
                        <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            autoComplete="given-name"
                            value={formData.nombre}
                            onChange={(e) => handleChange("nombre", e.target.value)}
                            placeholder="Ej: Juan"
                            disabled={isLoading}
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.nombre && (
                        <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>
                    )}
                    {isEditMode && camposModificados.has("nombre") && (
                        <ModifiedIndicator field="nombre" />
                    )}
                </div>

                {/* Apellido */}
                <div>
                    <Label>Apellido</Label>
                    <div className="relative">
                        <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            autoComplete="family-name"
                            value={formData.apellido}
                            onChange={(e) => handleChange("apellido", e.target.value)}
                            placeholder="Ej: Pérez"
                            disabled={isLoading}
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.apellido && (
                        <p className="text-sm text-red-500 mt-1">{errors.apellido}</p>
                    )}
                    {isEditMode && camposModificados.has("apellido") && (
                        <ModifiedIndicator field="apellido" />
                    )}
                </div>

                {/* Correo */}
                <div>
                    <Label>Correo Electrónico *</Label>
                    <div className="relative">
                        <EnvelopeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            type="email"
                            autoComplete="email"
                            value={formData.correo}
                            onChange={(e) => handleChange("correo", e.target.value)}
                            placeholder="Ej: usuario@example.com"
                            disabled={isLoading}
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.correo && (
                        <p className="text-sm text-red-500 mt-1">{errors.correo}</p>
                    )}
                    {isEditMode && camposModificados.has("correo") && (
                        <ModifiedIndicator field="correo" />
                    )}
                </div>

                {/* Teléfono */}
                <div>
                    <Label>Teléfono *</Label>
                    <div className="relative">
                        <PhoneIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            autoComplete="tel"
                            value={formData.telefono}
                            onChange={(e) => handleChange("telefono", e.target.value)}
                            placeholder="Ej: 0987654321"
                            maxLength={10}
                            disabled={isLoading}
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.telefono && (
                        <p className="text-sm text-red-500 mt-1">{errors.telefono}</p>
                    )}
                    {isEditMode && camposModificados.has("telefono") && (
                        <ModifiedIndicator field="teléfono" />
                    )}
                </div>

                {/* Dirección */}
                <div>
                    <Label>Dirección *</Label>
                    <div className="relative">
                        <HomeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            autoComplete="street-address"
                            value={formData.direccion}
                            onChange={(e) => handleChange("direccion", e.target.value)}
                            placeholder="Ej: Av. Principal 123"
                            disabled={isLoading}
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.direccion && (
                        <p className="text-sm text-red-500 mt-1">{errors.direccion}</p>
                    )}
                    {isEditMode && camposModificados.has("direccion") && (
                        <ModifiedIndicator field="dirección" />
                    )}
                </div>

                {/* Ciudad */}
                <div>
                    <Label>Ciudad *</Label>
                    <div className="relative">
                        <MapIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            autoComplete="address-level2"
                            value={formData.ciudad}
                            onChange={(e) => handleChange("ciudad", e.target.value)}
                            placeholder="Ej: Quito"
                            disabled={isLoading}
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {errors.ciudad && (
                        <p className="text-sm text-red-500 mt-1">{errors.ciudad}</p>
                    )}
                    {isEditMode && camposModificados.has("ciudad") && (
                        <ModifiedIndicator field="ciudad" />
                    )}
                </div>

                {/* Rol */}
                <div>
                    <Label>Rol *</Label>
                    <div className="relative">
                        <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <select
                            value={formData.role}
                            onChange={(e) => handleChange("role", e.target.value ? parseInt(e.target.value) : 0)}
                            disabled={isLoading}
                            className="pl-10 pr-4 py-2 w-full rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <option value="">Seleccionar un rol</option>
                            {roles.map((rol) => (
                                <option key={rol.id} value={rol.id}>
                                    {rol.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.role && (
                        <p className="text-sm text-red-500 mt-1">{errors.role}</p>
                    )}
                    {isEditMode && camposModificados.has("role") && (
                        <ModifiedIndicator field={`rol a: ${roles.find(r => r.id === formData.role)?.nombre || formData.role}`} />
                    )}
                </div>

                {/* Estado - Solo en edit mode */}
                {isEditMode && formData.estado !== undefined && (
                    <div className="space-y-2">
                        <Label>Estado</Label>
                        <div className="relative">
                            <select
                                value={formData.estado.toString()}
                                onChange={(e) => handleChange("estado", e.target.value === "true")}
                                disabled={isLoading}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                            >
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>
                        {camposModificados.has("estado") && (
                            <ModifiedIndicator
                                field={`estado a: ${formData.estado ? "Activo" : "Inactivo"}`}
                            />
                        )}
                    </div>
                )}

                {/* Fechas - Solo en edit mode */}
                {isEditMode && formData.createdAt && (
                    <div>
                        <Label>Fecha de creación</Label>
                        <Input value={new Date(formData.createdAt).toLocaleString()} disabled />
                    </div>
                )}

                {isEditMode && formData.updatedAt && (
                    <div>
                        <Label>Última actualización</Label>
                        <Input value={new Date(formData.updatedAt).toLocaleString()} disabled />
                    </div>
                )}

                {/* Contraseña - Solo en create mode */}
                {!isEditMode && (
                    <>
                        <div>
                            <Label>Contraseña (Opcional)</Label>
                            <div className="relative">
                                <LockClosedIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                <Input
                                    type="password"
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    placeholder="Dejar en blanco para enviar invitación por correo"
                                    disabled={isLoading}
                                    className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Si dejas la contraseña en blanco, se enviará un enlace de invitación al correo
                            </p>
                        </div>

                        <div>
                            <Label>Confirmar Contraseña (Opcional)</Label>
                            <div className="relative">
                                <LockClosedIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                <Input
                                    type="password"
                                    autoComplete="new-password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                    placeholder="Confirma la contraseña"
                                    disabled={isLoading}
                                    className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                            )}
                        </div>
                    </>
                )}
            </>
        );
    }
}

function ModifiedIndicator({ field }: { field: string }) {
    return (
        <div className="mt-2 flex items-start text-sm text-yellow-600">
            <svg
                className="h-4 w-4 text-yellow-500 mt-0.5 mr-1 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                />
            </svg>
            <span>Se actualizará el {field}</span>
        </div>
    );
}
