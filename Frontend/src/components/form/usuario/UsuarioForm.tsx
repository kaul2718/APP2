"use client";

import React from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useUsuarioForm } from "./useUsuarioForm";
import { UsuarioFormData, UsuarioFormMode } from "./types";
import { useRoles } from "@/hooks/useRoles";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/usePermissions";
import {
    UserIcon,
    IdentificationIcon,
    EnvelopeIcon,
    PhoneIcon,
    HomeIcon,
    MapIcon,
    LockClosedIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { AsYouType } from 'libphonenumber-js';

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
    const { role: currentUserRole } = usePermissions();
    const { data: session } = useSession();
    const token = session?.accessToken || null;

    const idInputId = React.useId();
    const cedulaInputId = React.useId();
    const nombreInputId = React.useId();
    const apellidoInputId = React.useId();
    const correoInputId = React.useId();
    const telefonoInputId = React.useId();
    const direccionInputId = React.useId();
    const ciudadInputId = React.useId();
    const roleInputId = React.useId();
    const estadoInputId = React.useId();
    const passwordInputId = React.useId();
    const confirmPasswordInputId = React.useId();

    const [buscandoSri, setBuscandoSri] = React.useState(false);
    const [mensajeSri, setMensajeSri] = React.useState<{ tipo: "exito" | "error" | "cargando"; texto: string } | null>(null);

    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const handleTelefonoChange = React.useCallback((value: string) => {
        const formatted = new AsYouType('EC').input(value);
        handleChange("telefono", formatted);
    }, [handleChange]);

    const consultarDocumentoSri = React.useCallback(async (doc: string) => {
        if (!doc || (doc.length !== 10 && doc.length !== 13)) return;
        if (!token) return;

        setBuscandoSri(true);
        setMensajeSri({ tipo: "cargando", texto: "⏳ Consultando datos de Registro Civil / SRI..." });

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/sri/consultar/${doc}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("No se encontraron registros");
            }

            const data = await response.json();
            if (data && data.success) {
                setMensajeSri({ tipo: "exito", texto: "✅ Datos encontrados" });
                
                const partes = data.name.trim().split(/\s+/);
                if (partes.length >= 4) {
                    handleChange("nombre", `${partes[2]} ${partes[3] || ""}`.trim());
                    handleChange("apellido", `${partes[0]} ${partes[1]}`.trim());
                } else if (partes.length === 3) {
                    handleChange("nombre", partes[2]);
                    handleChange("apellido", `${partes[0]} ${partes[1]}`);
                } else if (partes.length === 2) {
                    handleChange("nombre", partes[1]);
                    handleChange("apellido", partes[0]);
                } else {
                    handleChange("nombre", data.name);
                    handleChange("apellido", ".");
                }

                if (data.address) {
                    handleChange("direccion", data.address);
                    handleChange("ciudad", data.city || "QUITO");
                }
            } else {
                setMensajeSri({ tipo: "error", texto: "❌ No se encontró información" });
            }
        } catch (error) {
            setMensajeSri({ tipo: "error", texto: "❌ No se encontró información" });
        } finally {
            setBuscandoSri(false);
        }
    }, [token, handleChange]);

    React.useEffect(() => {
        if (mode === "create" && (formData.cedula.length === 10 || formData.cedula.length === 13)) {
            consultarDocumentoSri(formData.cedula);
        } else {
            setMensajeSri(null);
        }
    }, [formData.cedula, mode, consultarDocumentoSri]);

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
                        <Label htmlFor={idInputId}>ID</Label>
                        <Input id={idInputId} name="id" value={formData.id} disabled />
                    </div>
                )}

                {/* Cédula */}
                <div>
                    <Label htmlFor={cedulaInputId}>Cédula o RUC {!isEditMode && "*"}</Label>
                    <div className="relative">
                        <IdentificationIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            id={cedulaInputId}
                            value={formData.cedula}
                            onChange={(e) => handleChange("cedula", e.target.value)}
                            placeholder="Ej: 0601234567"
                            maxLength={13}
                            disabled={isLoading || buscandoSri}
                            className="pl-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                    </div>
                    {mensajeSri && (
                        <p className={`text-sm mt-1.5 font-medium ${
                            mensajeSri.tipo === "cargando" ? "text-blue-600 dark:text-blue-400 animate-pulse" :
                            mensajeSri.tipo === "exito" ? "text-green-600 dark:text-green-400" : "text-red-500"
                        }`}>
                            {mensajeSri.texto}
                        </p>
                    )}
                    {errors.cedula && !mensajeSri && (
                        <p className="text-sm text-red-500 mt-1">{errors.cedula}</p>
                    )}
                    {isEditMode && camposModificados.has("cedula") && (
                        <ModifiedIndicator field="cédula" />
                    )}
                </div>

                {/* Nombre */}
                <div>
                    <Label htmlFor={nombreInputId}>Nombre *</Label>
                    <div className="relative">
                        <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            id={nombreInputId}
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
                    <Label htmlFor={apellidoInputId}>Apellido *</Label>
                    <div className="relative">
                        <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            id={apellidoInputId}
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
                    <Label htmlFor={correoInputId}>Correo Electrónico *</Label>
                    <div className="relative">
                        <EnvelopeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            id={correoInputId}
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
                    <Label htmlFor={telefonoInputId}>Teléfono *</Label>
                    <div className="relative">
                        <PhoneIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            id={telefonoInputId}
                            autoComplete="tel"
                            value={formData.telefono}
                            onChange={(e) => handleTelefonoChange(e.target.value)}
                            placeholder="Ej: 099 123 4567"
                            maxLength={16}
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
                    <Label htmlFor={direccionInputId}>Dirección *</Label>
                    <div className="relative">
                        <HomeIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            id={direccionInputId}
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
                    <Label htmlFor={ciudadInputId}>Ciudad *</Label>
                    <div className="relative">
                        <MapIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            id={ciudadInputId}
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
                    <Label htmlFor={roleInputId}>Rol *</Label>
                    <div className="relative">
                        <UserIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <select
                            id={roleInputId}
                            value={formData.role}
                            onChange={(e) => handleChange("role", e.target.value ? parseInt(e.target.value) : 0)}
                            disabled={isLoading}
                            className="pl-10 pr-4 py-2 w-full rounded-md bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <option value="">Seleccionar un rol</option>
                             {roles
                                .filter((rol) => {
                                    if (currentUserRole === 'recep') {
                                        return rol.slug === 'client';
                                    }
                                    return true;
                                })
                                .map((rol) => (
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
                        <Label htmlFor={estadoInputId}>Estado</Label>
                        <div className="relative">
                            <select
                                id={estadoInputId}
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

                {/* Contraseña */}
                <div>
                    <Label htmlFor={passwordInputId}>{isEditMode ? "Nueva Contraseña (Opcional)" : "Contraseña (Opcional)"}</Label>
                    <div className="relative">
                        <LockClosedIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            id={passwordInputId}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={formData.password || ""}
                            onChange={(e) => handleChange("password", e.target.value)}
                            placeholder={isEditMode ? "Dejar en blanco para no cambiar" : "Mín. 8 caracteres, 1 mayúscula, 1 número, 1 especial"}
                            disabled={isLoading}
                            className="pl-10 pr-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none z-10"
                        >
                            {showPassword ? (
                                <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                                <EyeIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                    )}
                    {isEditMode && camposModificados.has("password") && (
                        <ModifiedIndicator field="contraseña" />
                    )}
                </div>

                <div>
                    <Label htmlFor={confirmPasswordInputId}>{isEditMode ? "Confirmar Nueva Contraseña" : "Confirmar Contraseña (Opcional)"}</Label>
                    <div className="relative">
                        <LockClosedIcon className="w-5 h-5 text-gray-600 dark:text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <Input
                            id={confirmPasswordInputId}
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={formData.confirmPassword || ""}
                            onChange={(e) => handleChange("confirmPassword", e.target.value)}
                            placeholder="Confirma la contraseña"
                            disabled={isLoading}
                            className="pl-10 pr-10 bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none z-10"
                        >
                            {showConfirmPassword ? (
                                <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                                <EyeIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                    )}
                </div>
            </>
        );
    }
}

function ModifiedIndicator({ field }: { field: string }) {
    return (
        <div className="mt-2 flex items-start text-sm text-amber-800 dark:text-amber-400">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 mr-1 flex-shrink-0" />
            <span>Se actualizará el {field}</span>
        </div>
    );
}
