"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Usuario } from "@/hooks/useUsuario";
import { Role } from "@/types/role";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    usuario: Usuario | null;
    onSave: (updatedUsuario: Usuario) => void;
}

export default function UsuarioEditModal({ isOpen, onClose, usuario, onSave }: Props) {
    const { data: session } = useSession();
    const token = session?.accessToken || null;
    const [editando, setEditando] = React.useState<Usuario | null>(usuario);
    const [cargando, setCargando] = React.useState(false);
    const [camposModificados, setCamposModificados] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        setEditando(usuario);
        setCamposModificados(new Set());
    }, [usuario]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditando(prev => {
            if (!prev) return null;
            
            const nuevoUsuario = { ...prev, [name]: value };
            
            // Verificar si el valor ha cambiado respecto al original
            if (usuario && usuario[name as keyof Usuario] !== value) {
                setCamposModificados(prev => new Set(prev).add(name));
            } else {
                setCamposModificados(prev => {
                    const nuevos = new Set(prev);
                    nuevos.delete(name);
                    return nuevos;
                });
            }
            
            return nuevoUsuario;
        });
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditando(prev => {
            if (!prev) return null;
            
            const nuevoValor = name === "role" ? value as Role : value === "true";
            const nuevoUsuario = { ...prev, [name]: nuevoValor };
            
            // Verificar si el valor ha cambiado respecto al original
            if (usuario && usuario[name as keyof Usuario] !== nuevoValor) {
                setCamposModificados(prev => new Set(prev).add(name));
            } else {
                setCamposModificados(prev => {
                    const nuevos = new Set(prev);
                    nuevos.delete(name);
                    return nuevos;
                });
            }
            
            return nuevoUsuario;
        });
    };

    const handleCancel = () => {
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editando || !token) return;

        setCargando(true);
        try {
            // Preparar solo los campos modificados
            const cambios: Partial<Usuario> = {};
            
            camposModificados.forEach(campo => {
                if (editando[campo as keyof Usuario] !== undefined) {
                    cambios[campo as keyof Usuario] = editando[campo as keyof Usuario];
                }
            });

            if (camposModificados.size > 0) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${editando.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(cambios),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Error: ${response.status}`);
                }

                const data = await response.json();
                onSave(data);
                toast.success("Cambios guardados correctamente");
                onClose();
            } else {
                toast.info("No se realizaron cambios");
            }
        } catch (error) {
           // console.error("Error al guardar cambios:", error);
            toast.error(error instanceof Error ? error.message : "Error al guardar cambios");
            setEditando(usuario);
        } finally {
            setCargando(false);
            setCamposModificados(new Set());
        }
    };

    if (!editando) return null;

    const formatRoleName = (role: Role): string => {
        return role.charAt(0) + role.slice(1).toLowerCase();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[800px] m-4" title="Editar Usuario">
            <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Editar información del usuario
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Modifica los datos del usuario. Solo los campos cambiados se actualizarán.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="custom-scrollbar h-[500px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            {/* Información básica */}
                            <div>
                                <Label>ID</Label>
                                <Input name="id" value={editando.id} disabled />
                            </div>
                            
                            <div>
                                <Label>Nombre *</Label>
                                <Input
                                    name="nombre"
                                    value={editando.nombre}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                />
                                {camposModificados.has("nombre") && (
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
                                        <span>Se actualizará el nombre</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label>Apellido</Label>
                                <Input
                                    name="apellido"
                                    value={editando.apellido}
                                    onChange={handleInputChange}
                                    disabled={cargando}
                                />
                                {camposModificados.has("apellido") && (
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
                                        <span>Se actualizará el apellido</span>
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <Label>Cédula *</Label>
                                <Input
                                    name="cedula"
                                    value={editando.cedula}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                />
                                {camposModificados.has("cedula") && (
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
                                        <span>Se actualizará la cédula</span>
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <Label>Correo Electrónico *</Label>
                                <Input
                                    name="correo"
                                    type="email"
                                    value={editando.correo}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                />
                                {camposModificados.has("correo") && (
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
                                        <span>Se actualizará el correo</span>
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <Label>Teléfono *</Label>
                                <Input
                                    name="telefono"
                                    value={editando.telefono}
                                    onChange={handleInputChange}
                                    required
                                    disabled={cargando}
                                />
                                {camposModificados.has("telefono") && (
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
                                        <span>Se actualizará el teléfono</span>
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <Label>Dirección</Label>
                                <Input
                                    name="direccion"
                                    value={editando.direccion}
                                    onChange={handleInputChange}
                                    disabled={cargando}
                                />
                                {camposModificados.has("direccion") && (
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
                                        <span>Se actualizará la dirección</span>
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <Label>Ciudad</Label>
                                <Input
                                    name="ciudad"
                                    value={editando.ciudad}
                                    onChange={handleInputChange}
                                    disabled={cargando}
                                />
                                {camposModificados.has("ciudad") && (
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
                                        <span>Se actualizará la ciudad</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="role-select">Rol *</Label>
                                <div className="relative">
                                    <select
                                        id="role-select"
                                        name="role"
                                        value={editando.role}
                                        onChange={handleSelectChange}
                                        disabled={cargando}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                    >
                                        {Object.values(Role).map(role => (
                                            <option key={role} value={role}>
                                                {formatRoleName(role)}
                                            </option>
                                        ))}
                                    </select>
                                    {camposModificados.has("role") && (
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
                                            <span>Se actualizará el rol a: <strong>{formatRoleName(editando.role)}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="estado-select">Estado</Label>
                                <div className="relative">
                                    <select
                                        id="estado-select"
                                        name="estado"
                                        value={editando.estado.toString()}
                                        onChange={handleSelectChange}
                                        disabled={cargando}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 disabled:opacity-50"
                                    >
                                        <option value="true">Activo</option>
                                        <option value="false">Inactivo</option>
                                    </select>
                                    {camposModificados.has("estado") && (
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
                                            <span>Se actualizará el estado a: <strong>{editando.estado ? "Activo" : "Inactivo"}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <Label>Fecha de creación</Label>
                                <Input
                                    value={new Date(editando.createdAt).toLocaleString()}
                                    disabled
                                />
                            </div>
                            
                            <div>
                                <Label>Última actualización</Label>
                                <Input
                                    value={new Date(editando.updatedAt).toLocaleString()}
                                    disabled
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={cargando}>
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={cargando || camposModificados.size === 0}
                            loading={cargando}
                        >
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}