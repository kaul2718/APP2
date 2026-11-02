"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { PlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useOrders } from "@/hooks/useOrders";
import { useEquipos } from "@/hooks/useEquipos";
import { useUsuario } from "@/hooks/useUsuario";
import { useEstadoOrden } from "@/hooks/useEstadoOrden";
import { Role } from "@/types/role";
import AgregarClienteModal from "@/components/modals/AgregarClienteModal";
import AgregarEquipoModal from "@/components/modals/AgregarEquipoModal";
import { Combobox } from '@headlessui/react'
import { MagnifyingGlassIcon, ClipboardDocumentCheckIcon, BoltIcon } from '@heroicons/react/24/outline'
import { OrderType } from "@/types/order.types";
import { ChecklistItemResult, EstadoEncendido, EstadoFisico, InspeccionRecepcionData } from "@/types/checklist.types";
import { useChecklistTemplate } from "@/hooks/useChecklistTemplate";
import InspeccionRecepcionForm from "./InspeccionRecepcionForm";

interface FormData {
    workOrderNumber?: string;
    clientId: number | null;
    equipoId: number | null;
    problemaReportado: string;
    accesorios: string[];
    fechaPrometidaEntrega: string;
    technicianId: number | null;
    estadoOrdenId: number | null;
    currentAccessory: string;
    tipoOrden: OrderType;
    checklistData: any;
    tiempoEstimadoReparacion?: number;
}

interface FormErrors {
    clientId?: string;
    equipoId?: string;
    problemaReportado?: string;
}

interface IngresarOrdenFormProps {
    onSuccess?: (order: { id: number; workOrderNumber: string }) => void;
    onCancel?: () => void;
    embeddedMode?: boolean;
}


export default function IngresarOrdenForm({ onSuccess, onCancel, embeddedMode = false }: IngresarOrdenFormProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const { createOrder, getTechniciansAvailability } = useOrders();

    // Estados para controlar los modales
    const [isClienteModalOpen, setIsClienteModalOpen] = React.useState(false);
    const [isEquipoModalOpen, setIsEquipoModalOpen] = React.useState(false);

    // IDs de Accesibilidad
    const accessoryInputId = React.useId();
    const hoursInputId = React.useId();
    const deliveryDateId = React.useId();
    const technicianSelectId = React.useId();

    // Estado adicional para búsqueda
    const [clientSearch, setClientSearch] = React.useState('')
    const [remoteClientResults, setRemoteClientResults] = React.useState<any[]>([]);
    const [isSearchingClientRemote, setIsSearchingClientRemote] = React.useState(false);
    const [equipoSearch, setEquipoSearch] = React.useState('')
    const [techAvailability, setTechAvailability] = React.useState<any[]>([]);

    // Hooks para obtener datos necesarios
    const { usuarios: clientUsuarios = [], loading: loadingUsuarios, refetch: refetchUsuarios, fetchUsuarios, setUsuarios } = useUsuario({ defaultLimit: 1000, defaultRole: Role.CLIENT });
    const { usuarios: techUsuarios = [] } = useUsuario({ defaultLimit: 1000, defaultRole: Role.TECH });
    const { equipos = [], loading: loadingEquipos, refetch: refetchEquipos, fetchEquipos } = useEquipos({ defaultLimit: 1000 });
    const { estadosOrden } = useEstadoOrden();

    // Listas locales para nuevos registros creados al instante (resuelven problemas de paginación)
    const [extraClientes, setExtraClientes] = React.useState<any[]>([]);
    const [extraEquipos, setExtraEquipos] = React.useState<any[]>([]);

    React.useEffect(() => {
        getTechniciansAvailability().then(data => {
            setTechAvailability(data || []);
        });
    }, []);

    // Filtrar clientes (usuarios con rol 'CLIENT'), combinando con los creados localmente y resultados remotos
    const clientes = React.useMemo(() => {
        const list = [...extraClientes, ...remoteClientResults, ...clientUsuarios];
        const seen = new Set();
        return list.filter(
            (usuario) => {
                if (!usuario || seen.has(usuario.id)) return false;
                seen.add(usuario.id);
                return (usuario.role === Role.CLIENT || usuario.role === undefined) && usuario.estado;
            }
        );
    }, [clientUsuarios, extraClientes, remoteClientResults]);

    const tecnicos = React.useMemo(() =>
        techUsuarios.filter(usuario => usuario.role === Role.TECH && usuario.estado),
        [techUsuarios]
    );

    // Búsqueda remota por cédula o nombre en tiempo real si el término tiene al menos 3 caracteres
    React.useEffect(() => {
        const query = clientSearch.trim();
        if (query.length < 3) {
            setRemoteClientResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            if (!session?.accessToken) return;
            try {
                setIsSearchingClientRemote(true);
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/all?page=1&limit=50&search=${encodeURIComponent(query)}&role=${Role.CLIENT}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    }
                );
                if (res.ok) {
                    const data = await res.json();
                    if (data?.items && Array.isArray(data.items)) {
                        setRemoteClientResults(data.items);
                    }
                }
            } catch (err) {
                // Silencioso
            } finally {
                setIsSearchingClientRemote(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [clientSearch, session?.accessToken]);

    // Filtrar clientes según búsqueda (por cédula, nombre, apellido, correo o teléfono)
    const filteredClientes = React.useMemo(() => {
        if (!clientSearch.trim()) return clientes;
        const query = clientSearch.toLowerCase().trim();
        const matches = clientes.filter(cliente => {
            const fullName = `${cliente.nombre || ''} ${cliente.apellido || ''}`.toLowerCase();
            const cedula = (cliente.cedula || '').toLowerCase();
            const correo = (cliente.correo || '').toLowerCase();
            const telefono = (cliente.telefono || '').toLowerCase();
            return fullName.includes(query) || cedula.includes(query) || correo.includes(query) || telefono.includes(query);
        });

        // Priorizar coincidencias exactas o iniciales por número de cédula
        return matches.sort((a, b) => {
            const aCedula = (a.cedula || '').toLowerCase();
            const bCedula = (b.cedula || '').toLowerCase();
            if (aCedula === query && bCedula !== query) return -1;
            if (bCedula === query && aCedula !== query) return 1;
            if (aCedula.startsWith(query) && !bCedula.startsWith(query)) return -1;
            if (bCedula.startsWith(query) && !aCedula.startsWith(query)) return 1;
            return 0;
        });
    }, [clientes, clientSearch]);

    // Equipos combinados con equipos creados al instante
    const combinedEquipos = React.useMemo(() => {
        const list = [...extraEquipos, ...equipos];
        const seen = new Set();
        return list.filter(equipo => {
            if (seen.has(equipo.id)) return false;
            seen.add(equipo.id);
            return equipo.estado;
        });
    }, [equipos, extraEquipos]);

    // Filtrar equipos según búsqueda
    const filteredEquipos = equipoSearch === ''
        ? combinedEquipos
        : combinedEquipos.filter(equipo =>
            `${equipo.tipoEquipo?.nombre} ${equipo.marca?.nombre} ${equipo.modelo?.nombre} ${equipo.numeroSerie}`
                .toLowerCase()
                .includes(equipoSearch.toLowerCase())
        )

    const [formData, setFormData] = React.useState<FormData>({
        //workOrderNumber: "",
        clientId: null,
        equipoId: null,
        problemaReportado: "",
        accesorios: [],
        fechaPrometidaEntrega: "",
        technicianId: null,
        estadoOrdenId: null,
        currentAccessory: "",
        tipoOrden: OrderType.EXPRESS,
        checklistData: null,
        tiempoEstimadoReparacion: 0
    });

    // Estados para inspección rápida en modalidad Express
    const [expressEncendido, setExpressEncendido] = React.useState<EstadoEncendido>('no_probado');
    const [expressFisico, setExpressFisico] = React.useState<EstadoFisico>('no_revisado');
    const [expressObservacion, setExpressObservacion] = React.useState<string>('');

    // Escenario B: Borrador aislado por usuario autenticado con TTL de 12 horas
    const currentUserId = session?.user?.id ? String(session.user.id) : null;
    const DRAFT_STORAGE_KEY = currentUserId ? `hdc_orden_draft_v1_u${currentUserId}` : null;
    const DRAFT_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

    const [draftAvailable, setDraftAvailable] = React.useState<{ timestamp: number; summary: string } | null>(null);
    const clientRequestIdRef = React.useRef<string>(
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    );

    // Detección de borrador previo aislado al montar o cambiar de usuario
    React.useEffect(() => {
        if (!DRAFT_STORAGE_KEY) {
            setDraftAvailable(null);
            return;
        }
        try {
            const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const age = Date.now() - (parsed?.timestamp || 0);

                // Si expiró (> 12h), limpiar para proteger privacidad en tabletas compartidas
                if (age > DRAFT_TTL_MS) {
                    localStorage.removeItem(DRAFT_STORAGE_KEY);
                    setDraftAvailable(null);
                    return;
                }

                if (parsed.formData?.problemaReportado || parsed.formData?.clientId || parsed.formData?.equipoId) {
                    setDraftAvailable({
                        timestamp: parsed.timestamp,
                        summary: parsed.formData?.problemaReportado
                            ? `"${parsed.formData.problemaReportado.slice(0, 45)}..."`
                            : 'Datos de cliente y equipo registrados'
                    });
                }
            }
        } catch (e) {
            console.warn('Error leyendo borrador local:', e);
        }
    }, [DRAFT_STORAGE_KEY]);

    // Autoguardado periódico del borrador en LocalStorage aislado
    React.useEffect(() => {
        if (!DRAFT_STORAGE_KEY) return;
        if (!formData.problemaReportado && !formData.clientId && !formData.equipoId && (!formData.accesorios || formData.accesorios.length === 0)) {
            return;
        }
        const timer = setTimeout(() => {
            try {
                localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
                    formData,
                    expressEncendido,
                    expressFisico,
                    expressObservacion,
                    timestamp: Date.now()
                }));
            } catch (e) {
                // Ignore storage quota
            }
        }, 1200);
        return () => clearTimeout(timer);
    }, [formData, expressEncendido, expressFisico, expressObservacion, DRAFT_STORAGE_KEY]);

    const handleRestoreDraft = () => {
        if (!DRAFT_STORAGE_KEY) return;
        try {
            const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.formData) setFormData(parsed.formData);
                if (parsed.expressEncendido) setExpressEncendido(parsed.expressEncendido);
                if (parsed.expressFisico) setExpressFisico(parsed.expressFisico);
                if (parsed.expressObservacion) setExpressObservacion(parsed.expressObservacion);
                toast.success('Borrador recuperado con éxito');
            }
        } catch (e) {
            toast.error('No se pudo restaurar el borrador');
        } finally {
            setDraftAvailable(null);
        }
    };

    const handleDiscardDraft = () => {
        if (DRAFT_STORAGE_KEY) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
        setDraftAvailable(null);
        toast.info('Borrador descartado');
    };

    const [errors, setErrors] = React.useState<FormErrors>({});
    const [loading, setLoading] = React.useState(false);
    const hasLoadedExtendedUsers = React.useRef(false);
    const hasLoadedExtendedEquipos = React.useRef(false);
    const { getTemplateByTipoEquipo, selectedTemplate, loadingTemplate } = useChecklistTemplate();

    React.useEffect(() => {
        if (hasLoadedExtendedUsers.current) return;
        hasLoadedExtendedUsers.current = true;
        void fetchUsuarios(1, 1000, "", false, Role.CLIENT);
    }, [fetchUsuarios]);

    React.useEffect(() => {
        if (hasLoadedExtendedEquipos.current) return;
        hasLoadedExtendedEquipos.current = true;
        void fetchEquipos(1, 1000, "", false);
    }, [fetchEquipos]);

    // Cargar plantilla cuando cambia el equipo
    React.useEffect(() => {
        const fetchTemplate = async () => {
            if (formData.equipoId && formData.tipoOrden === OrderType.COMPLETA) {
                const equipo = combinedEquipos.find(e => e.id === Number(formData.equipoId)) as any;
                const tipoEquipoId = equipo?.tipoEquipo?.id || equipo?.tipoEquipoId;
                
                // Solo cargar si el tipo de equipo cambió y no es la plantilla que ya tenemos
                if (tipoEquipoId && (!selectedTemplate || selectedTemplate.tipoEquipoId !== Number(tipoEquipoId))) {
                    try {
                        await getTemplateByTipoEquipo(Number(tipoEquipoId));
                    } catch (error) {
                        console.log(`No hay plantilla para el tipo de equipo ${tipoEquipoId}`);
                    }
                }
            } else if (formData.tipoOrden !== OrderType.COMPLETA) {
                // Si cambia a Express, podemos limpiar la plantilla seleccionada si fuera necesario
                // Pero lo dejamos así para no interferir con el estado global si se vuelve a cambiar a Completa
            }
        };
        fetchTemplate();
    }, [formData.equipoId, formData.tipoOrden, combinedEquipos, getTemplateByTipoEquipo, selectedTemplate]);

    const handleChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field in errors) {
            setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
        }
    };

    const handleChecklistDataChange = React.useCallback((data: any) => {
        setFormData(prev => {
            if (JSON.stringify(prev.checklistData) === JSON.stringify(data)) {
                return prev;
            }
            return { ...prev, checklistData: data };
        });
    }, []);

    // Manejar creación de cliente
    const handleClienteCreado = async (nuevoCliente: any) => {
        // Inyectar el nuevo cliente inmediatamente en la lista local para que aparezca al instante
        const clientWithFields = {
            ...nuevoCliente,
            role: nuevoCliente.role || Role.CLIENT,
            estado: nuevoCliente.estado !== undefined ? nuevoCliente.estado : true
        };
        setExtraClientes(prev => [clientWithFields, ...prev]);
        setUsuarios(prev => [clientWithFields, ...prev]);
        setFormData(prev => ({ ...prev, clientId: clientWithFields.id }));
        setClientSearch(""); // Limpiar búsqueda para que el Combobox muestre el valor seleccionado
        await fetchUsuarios(1, 1000, "", false, Role.CLIENT); // Mantener la lista completa de usuarios actualizada
    };

    // Manejar creación de equipo
    const handleEquipoCreado = async (nuevoEquipo: any) => {
        // Inyectar el nuevo equipo inmediatamente en la lista local para que aparezca al instante
        setExtraEquipos(prev => [nuevoEquipo, ...prev]);
        setFormData(prev => ({ ...prev, equipoId: nuevoEquipo.id }));
        setEquipoSearch(""); // Limpiar búsqueda para que el Combobox muestre el valor seleccionado
        await refetchEquipos(); // Actualiza la lista de equipos en segundo plano
    };

    const addAccessory = () => {
        if (formData.currentAccessory.trim()) {
            handleChange("accesorios", [...formData.accesorios, formData.currentAccessory]);
            setFormData(prev => ({ ...prev, currentAccessory: "" }));
        }
    };

    const removeAccessory = (index: number) => {
        const newAccessories = [...formData.accesorios];
        newAccessories.splice(index, 1);
        handleChange("accesorios", newAccessories);
    };

    const validateFields = () => {
        const newErrors: FormErrors = {};
        let isValid = true;

        // Validación de cliente
        if (!formData.clientId) {
            newErrors.clientId = "Debe seleccionar un cliente";
            isValid = false;
            // Scroll al campo y foco automático
            setTimeout(() => {
                document.getElementById('client-select')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document.getElementById('client-select')?.focus();
            }, 100);
        }

        // Validación de equipo
        if (!formData.equipoId) {
            newErrors.equipoId = "Debe seleccionar un equipo";
            isValid = false;
            if (formData.clientId) {
                setTimeout(() => {
                    document.getElementById('equipo-select')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    document.getElementById('equipo-select')?.focus();
                }, 100);
            }
        } else {
            const selectedEq = combinedEquipos.find(e => e.id === Number(formData.equipoId));
            if (selectedEq?.ordenActiva) {
                newErrors.equipoId = `El equipo ya se encuentra en taller bajo la orden #${selectedEq.ordenActiva.workOrderNumber} (${selectedEq.ordenActiva.estadoNombre})`;
                isValid = false;
            }
        }

        // Validación de problema reportado
        if (!formData.problemaReportado.trim()) {
            newErrors.problemaReportado = "El problema reportado es requerido";
            isValid = false;
            if (formData.clientId && formData.equipoId) {
                setTimeout(() => {
                    document.getElementById('problema-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    document.getElementById('problema-textarea')?.focus();
                }, 100);
            }
        } else if (formData.problemaReportado.trim().length < 10) {
            newErrors.problemaReportado = "La descripción debe tener al menos 10 caracteres";
            isValid = false;
        }

        setErrors(newErrors);

        // Mostrar notificación toast si hay errores
        if (!isValid) {
            toast.error('Por favor complete los campos requeridos', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }

        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación antes de enviar
        if (!validateFields()) {
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                clientId: Number(formData.clientId),
                equipoId: Number(formData.equipoId),
                problemaReportado: formData.problemaReportado,
                accesorios: formData.accesorios,
                fechaPrometidaEntrega: formData.fechaPrometidaEntrega || undefined,
                technicianId: formData.technicianId ? Number(formData.technicianId) : undefined,
                tipoOrden: formData.tipoOrden,
                checklistData: formData.tipoOrden === OrderType.COMPLETA
                    ? {
                        version: 2,
                        tipoOrden: OrderType.COMPLETA,
                        inspeccionRecepcion: formData.checklistData || {
                            fecha: new Date().toISOString(),
                            estadoEncendido: 'no_probado',
                            observacionGeneral: '',
                            fisica: [],
                            funcional: [],
                        },
                    }
                    : {
                        version: 2,
                        tipoOrden: OrderType.EXPRESS,
                        inspeccionRecepcion: {
                            fecha: new Date().toISOString(),
                            estadoEncendido: expressEncendido,
                            observacionGeneral: expressObservacion,
                            fisica: [
                                { item: 'Estado Físico General', estado: expressFisico, observaciones: expressObservacion },
                            ],
                            funcional: [
                                {
                                    item: 'Encendido / Arranque',
                                    estado: expressEncendido === 'correcto' ? 'funciona' : expressEncendido === 'falla' ? 'falla' : 'no_probado',
                                },
                            ],
                        },
                    },
                tiempoEstimadoReparacion: Number(formData.tiempoEstimadoReparacion) || 0,
                ...(formData.estadoOrdenId && { estadoOrdenId: Number(formData.estadoOrdenId) }),
                clientRequestId: clientRequestIdRef.current,
            };

            const result = await createOrder(orderData);

            if (!result?.id) {
                throw new Error("No se pudo crear la orden. Intente nuevamente.");
            }

            // Limpiar borrador local tras guardado exitoso
            if (DRAFT_STORAGE_KEY) {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
            setDraftAvailable(null);
            clientRequestIdRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            toast.success(`Orden #${result.workOrderNumber} creada exitosamente`, {
                position: "top-center",
                autoClose: 3000,
            });

            const tokenRaw = (result as any)?.tokenAccesoRaw;

            if (onSuccess) {
                onSuccess({
                    id: result.id,
                    workOrderNumber: result.workOrderNumber,
                    ...(tokenRaw ? { tokenAccesoRaw: tokenRaw } as any : {}),
                });
                return;
            }

            // Reset del formulario
            setFormData({
                clientId: null,
                equipoId: null,
                problemaReportado: "",
                accesorios: [],
                fechaPrometidaEntrega: "",
                technicianId: null,
                estadoOrdenId: null,
                currentAccessory: "",
                tipoOrden: OrderType.EXPRESS,
                checklistData: null,
                tiempoEstimadoReparacion: 0
            });

            if (!embeddedMode) {
                setTimeout(() => router.push('/ver-orden'), 1500);
            }

        } catch (error: any) {
            console.error('Error al crear orden:', error);
            if (typeof navigator !== 'undefined' && (!navigator.onLine || error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError'))) {
                toast.error(
                    'Se interrumpió la conexión a internet. Los datos de la recepción están guardados como borrador seguro en este dispositivo. Podrá continuar apenas se restablezca la red.',
                    {
                        position: 'top-center',
                        autoClose: 8000,
                    }
                );
            } else {
                toast.error(
                    error instanceof Error
                        ? `${error.message}`
                        : "Error desconocido al crear la orden",
                    {
                        position: "top-center",
                        autoClose: 5000,
                    }
                );
            }
        } finally {
            setLoading(false);
        }
    };
    const formContent = (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
            {/* Banner de Borrador Recuperable (Escenario B) */}
            {draftAvailable && (
                <div className="rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm dark:border-amber-800/60 dark:from-amber-950/40 dark:to-orange-950/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </span>
                            <div>
                                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                    Borrador no guardado encontrado ({new Date(draftAvailable.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                </h4>
                                <p className="text-xs text-amber-800/90 dark:text-amber-300/80">
                                    Se detectaron datos no enviados en este navegador: <span className="font-medium italic">{draftAvailable.summary}</span>.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <button
                                type="button"
                                onClick={handleRestoreDraft}
                                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                Recuperar datos
                            </button>
                            <button
                                type="button"
                                onClick={handleDiscardDraft}
                                className="rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-gray-800 dark:text-amber-200 dark:hover:bg-gray-700"
                            >
                                Descartar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Selección de cliente */}
            <div className="mb-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                    <Label htmlFor="client-select">Cliente *</Label>
                    <button
                        type="button"
                        onClick={() => setIsClienteModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Agregar nuevo cliente"
                    >
                        <PlusIcon className="h-3 w-3" />
                        Agregar cliente
                    </button>
                </div>
                <div className="min-w-0">
                    <div className="min-w-0 flex-1">
                        <Combobox value={formData.clientId} onChange={(value) => handleChange("clientId", value)}>
                            <div className="relative flex-grow">
                            <div className="relative">
                                <Combobox.Input
                                    id="client-select"
                                    className="w-full rounded-lg border border-gray-300 bg-white p-2 pl-10 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    displayValue={(value) => {
                                        const cliente = clientes.find((c) => c.id === value);
                                        if (!cliente) return "";
                                        const cedulaText = cliente.cedula ? ` (CI: ${cliente.cedula})` : "";
                                        return `${cliente.nombre} ${cliente.apellido}${cedulaText}`;
                                    }}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    placeholder={isSearchingClientRemote ? "Buscando por nombre o cédula..." : "Buscar cliente por nombre o cédula..."}
                                />
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            </div>

                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 sm:text-sm">
                                    {loadingUsuarios && clientes.length === 0 ? (
                                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                            Cargando clientes...
                                        </div>
                                    ) : filteredClientes.length === 0 && clientSearch !== "" ? (
                                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                            {isSearchingClientRemote ? "Buscando cliente..." : "No se encontraron clientes para este nombre o cédula"}
                                        </div>
                                    ) : (
                                        filteredClientes.map((cliente) => (
                                            <Combobox.Option
                                                key={cliente.id}
                                                value={cliente.id}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors ${active ? "bg-blue-600 text-white" : "text-gray-900 dark:text-gray-300"}`
                                                }
                                            >
                                                {({ selected, active }) => (
                                                    <>
                                                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex flex-col">
                                                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                                                    {cliente.nombre} {cliente.apellido}
                                                                </span>
                                                                {cliente.correo && (
                                                                    <span className={`text-[11px] truncate ${active ? "text-blue-100" : "text-gray-400 dark:text-gray-400"}`}>
                                                                        {cliente.correo}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {cliente.cedula && (
                                                                <span className={`inline-flex items-center self-start sm:self-auto px-2 py-0.5 rounded text-xs font-mono font-medium ${
                                                                    active
                                                                        ? "bg-blue-500 text-white"
                                                                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                                                }`}>
                                                                    CI: {cliente.cedula}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {selected && (
                                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))
                                    )}
                                </Combobox.Options>
                            </div>
                        </Combobox>
                    </div>
                </div>

                {errors.clientId && <p className="mt-1 text-sm text-red-500">{errors.clientId}</p>}
            </div>

            {/* Selección de equipo */}
            <div className="mb-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                    <Label htmlFor="equipo-select">Equipo *</Label>
                    <button
                        type="button"
                        onClick={() => setIsEquipoModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Agregar nuevo equipo"
                    >
                        <PlusIcon className="h-3 w-3" />
                        Agregar equipo
                    </button>
                </div>
                <div className="min-w-0">
                    <div className="min-w-0 flex-1">
                        <Combobox
                            value={formData.equipoId}
                            onChange={(value) => {
                                const selectedEq = combinedEquipos.find((e) => e.id === value);
                                if (selectedEq?.ordenActiva) {
                                    toast.warning(
                                        `El equipo ${selectedEq.numeroSerie} ya está en taller bajo la orden #${selectedEq.ordenActiva.workOrderNumber} (${selectedEq.ordenActiva.estadoNombre}). No puede seleccionarse para un nuevo ingreso.`,
                                        { position: "top-center", autoClose: 5000 }
                                    );
                                    return;
                                }
                                handleChange("equipoId", value);
                            }}
                            disabled={loadingEquipos}
                        >
                            <div className="relative flex-grow">
                            <div className="relative">
                                <Combobox.Input
                                    id="equipo-select"
                                    className={`w-full rounded-lg border bg-white p-2 pl-10 text-black dark:bg-gray-800 dark:text-white ${loadingEquipos ? "cursor-not-allowed opacity-50" : ""} ${errors.equipoId ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
                                    displayValue={(value) => {
                                        const equipo = combinedEquipos.find((e) => e.id === value);
                                        if (!equipo) return "";
                                        const enTallerText = equipo.ordenActiva ? ` [EN TALLER - ODS #${equipo.ordenActiva.workOrderNumber}]` : "";
                                        return `${equipo.tipoEquipo?.nombre} - ${equipo.marca?.nombre} ${equipo.modelo?.nombre} (${equipo.numeroSerie})${enTallerText}`;
                                    }}
                                    onChange={(e) => setEquipoSearch(e.target.value)}
                                    placeholder={loadingEquipos ? "Cargando equipos..." : "Buscar equipo..."}
                                    disabled={loadingEquipos}
                                />
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            </div>

                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 sm:text-sm">
                                    {loadingEquipos ? (
                                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                            Cargando equipos...
                                        </div>
                                    ) : filteredEquipos.length === 0 && equipoSearch !== "" ? (
                                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                            No se encontraron equipos
                                        </div>
                                    ) : (
                                        filteredEquipos.map((equipo) => {
                                            const estaEnTaller = Boolean(equipo.ordenActiva);
                                            return (
                                                <Combobox.Option
                                                    key={equipo.id}
                                                    value={equipo.id}
                                                    disabled={estaEnTaller}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors ${
                                                            estaEnTaller
                                                                ? "opacity-60 bg-gray-100/90 dark:bg-gray-800/80 cursor-not-allowed"
                                                                : active
                                                                ? "bg-blue-600 text-white"
                                                                : "text-gray-900 dark:text-gray-300"
                                                        }`
                                                    }
                                                >
                                                    {({ selected }) => (
                                                        <>
                                                            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                                                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"} ${estaEnTaller ? "text-gray-500 line-through dark:text-gray-400" : ""}`}>
                                                                    {equipo.tipoEquipo?.nombre} - {equipo.marca?.nombre} {equipo.modelo?.nombre} ({equipo.numeroSerie})
                                                                </span>
                                                                {estaEnTaller && equipo.ordenActiva && (
                                                                    <span className="inline-flex items-center gap-1 self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/60 shrink-0">
                                                                        ⚠️ EN TALLER · ODS #{equipo.ordenActiva.workOrderNumber} ({equipo.ordenActiva.estadoNombre})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {selected && (
                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </Combobox.Option>
                                            );
                                        })
                                    )}
                                </Combobox.Options>
                            </div>
                        </Combobox>
                    </div>
                </div>

                {errors.equipoId && <p className="mt-1 text-sm text-red-500">{errors.equipoId}</p>}
            </div>

            {/* Tipo de Orden y Peritaje */}
            <div className="mb-3">
                <span className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-400">Tipo de Orden de Servicio *</span>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => handleChange("tipoOrden", OrderType.EXPRESS)}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${formData.tipoOrden === OrderType.EXPRESS ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"}`}
                    >
                        <div className={`rounded-full p-2 ${formData.tipoOrden === OrderType.EXPRESS ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-700"}`}>
                            <BoltIcon className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white">Orden Express</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Recepción rápida (software, programas, mantenimiento ágil).</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleChange("tipoOrden", OrderType.COMPLETA)}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${formData.tipoOrden === OrderType.COMPLETA ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"}`}
                    >
                        <div className={`rounded-full p-2 ${formData.tipoOrden === OrderType.COMPLETA ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-700"}`}>
                            <ClipboardDocumentCheckIcon className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white">Orden Completa</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Inspección física y funcional de recepción completa.</p>
                        </div>
                    </button>
                </div>

                {formData.tipoOrden === OrderType.EXPRESS && (
                    <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 p-4 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <BoltIcon className="w-4 h-4 text-brand-500" />
                                Inspección Rápida de Recepción (Express)
                            </span>
                            <span className="text-[11px] text-gray-500 italic">Recepción en &lt; 60 seg</span>
                        </div>

                        {/* Encendido Express */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                                ¿El equipo enciende al recibir?
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'no_probado', label: 'No probado al recibir' },
                                    { value: 'correcto', label: 'Enciende OK' },
                                    { value: 'falla', label: 'No enciende' },
                                    { value: 'intermitente', label: 'Intermitente' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setExpressEncendido(opt.value as EstadoEncendido)}
                                        className={`px-3 py-2 min-h-[42px] rounded-lg border text-xs font-semibold transition-all ${
                                            expressEncendido === opt.value
                                                ? 'bg-brand-50 text-brand-700 border-brand-500 dark:bg-brand-950/40 dark:text-brand-300 ring-1 ring-brand-500'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Estado Físico Express */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                                Estado Físico y Estético General
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'no_revisado', label: 'No revisado' },
                                    { value: 'bueno', label: 'Buen estado general' },
                                    { value: 'desgaste', label: 'Rayones / Desgaste' },
                                    { value: 'danado', label: 'Golpe / Fisura' },
                                    { value: 'roto', label: 'Roto / Faltante' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setExpressFisico(opt.value as EstadoFisico)}
                                        className={`px-3 py-2 min-h-[42px] rounded-lg border text-xs font-semibold transition-all ${
                                            expressFisico === opt.value
                                                ? 'bg-brand-50 text-brand-700 border-brand-500 dark:bg-brand-950/40 dark:text-brand-300 ring-1 ring-brand-500'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nota Express */}
                        <div>
                            <input
                                type="text"
                                value={expressObservacion}
                                onChange={e => setExpressObservacion(e.target.value)}
                                placeholder="Nota de recepción física (ej. entregado sin cargador, pantalla rayada)..."
                                className="w-full p-2.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                        </div>
                    </div>
                )}

                {formData.tipoOrden === OrderType.COMPLETA && (
                    <div className="mt-4">
                        {!formData.equipoId ? (
                            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                Por favor seleccione un equipo primero para cargar la plantilla de revisión.
                            </div>
                        ) : loadingTemplate ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                                <span className="ml-3 text-sm text-gray-500">Cargando plantilla técnica...</span>
                            </div>
                        ) : (
                            <InspeccionRecepcionForm
                                template={selectedTemplate}
                                tipoEquipoNombre={(combinedEquipos.find(e => e.id === Number(formData.equipoId)) as any)?.tipoEquipo?.nombre || ''}
                                onChange={handleChecklistDataChange}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Problema reportado */}
            <div className="mb-3">
                <Label htmlFor="problema-textarea">Problema Reportado *</Label>
                <textarea
                    id="problema-textarea"
                    value={formData.problemaReportado}
                    onChange={(e) => handleChange("problemaReportado", e.target.value)}
                    placeholder="Describa el problema reportado por el cliente"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    rows={4}
                />
                {errors.problemaReportado && <p className="mt-1 text-sm text-red-500">{errors.problemaReportado}</p>}
            </div>

            {/* Accesorios */}
            <div className="mb-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                    <Label htmlFor={accessoryInputId}>Accesorios</Label>
                    <button
                        type="button"
                        onClick={addAccessory}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        <PlusIcon className="h-3 w-3" />
                        Agregar accesorio
                    </button>
                </div>
                <div className="flex items-start gap-2 sm:items-center">
                    <input
                        id={accessoryInputId}
                        value={formData.currentAccessory}
                        onChange={(e) => setFormData((prev) => ({ ...prev, currentAccessory: e.target.value }))}
                        placeholder="Ej: Cargador, Funda, Cable USB"
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {formData.accesorios.length > 0 && (
                    <div className="mt-2">
                        <ul className="space-y-1">
                            {formData.accesorios.map((accesorio, index) => (
                                <li
                                    key={index}
                                    className="flex items-center justify-between rounded bg-gray-200 px-3 py-2 text-black dark:bg-gray-700 dark:text-white"
                                >
                                    <span className="truncate">{accesorio}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeAccessory(index)}
                                        className="text-lg font-bold text-red-500 hover:text-red-700"
                                        title="Eliminar accesorio"
                                        aria-label={`Eliminar accesorio ${accesorio}`}
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Grid para Tiempo Estimado de Reparación y Fecha Estimada de Entrega */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-3">
                {/* Tiempo estimado de reparación */}
                <div>
                    <Label htmlFor={hoursInputId}>Horas Estimadas de Reparación</Label>
                    <input
                        id={hoursInputId}
                        type="number"
                        value={formData.tiempoEstimadoReparacion !== undefined ? formData.tiempoEstimadoReparacion : ""}
                        onChange={(e) => handleChange("tiempoEstimadoReparacion", e.target.value ? Number(e.target.value) : 0)}
                        min="0"
                        step="0.5"
                        placeholder="Ej: 2.5"
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {/* Fecha prometida de entrega */}
                <div>
                    <Label htmlFor={deliveryDateId} className="mb-1 block">Fecha Estimada de Entrega</Label>
                    <input
                        id={deliveryDateId}
                        type="datetime-local"
                        value={formData.fechaPrometidaEntrega}
                        onChange={(e) => handleChange("fechaPrometidaEntrega", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:block [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                    />
                </div>
            </div>

            {/* Selección de técnico */}
            <div className="mb-3">
                <Label htmlFor={technicianSelectId}>Técnico Asignado (Opcional)</Label>
                <select
                    id={technicianSelectId}
                    value={formData.technicianId || ""}
                    onChange={(e) => handleChange("technicianId", e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-black dark:border-gray-700 dark:bg-gray-800 dark:text-white font-medium"
                >
                    <option value="">Seleccione un técnico</option>
                    {tecnicos.map((tecnico) => {
                        const availability = techAvailability.find(a => a.technicianId === tecnico.id);
                        let label = `${tecnico.nombre} ${tecnico.apellido}`;
                        if (availability) {
                            const partsStr = availability.waitingForParts > 0 ? ` (${availability.waitingForParts} en espera de repuestos)` : '';
                            label += ` (Órdenes activas: ${availability.workingActive}${partsStr}`;
                            if (availability.nextAvailableDate) {
                                const estDate = new Date(availability.nextAvailableDate);
                                label += `, Disponible aprox: ${estDate.toLocaleDateString()})`;
                            } else {
                                label += `, Disp. inmediata)`;
                            }
                        }
                        return (
                            <option key={tecnico.id} value={tecnico.id}>
                                {label}
                            </option>
                        );
                    })}
                </select>
                {!loadingUsuarios && tecnicos.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">No se encontraron técnicos activos en la lista actual.</p>
                )}
            </div>

            <div className={embeddedMode ? "sticky bottom-0 -mx-1 mt-2 border-t border-gray-200 bg-white px-1 pt-4 dark:border-gray-700 dark:bg-gray-900" : "mt-2"}>
                <div className={embeddedMode ? "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" : "flex flex-col gap-2 sm:flex-row"}>
                    {onCancel && (
                        <Button
                            type="button"
                            onClick={onCancel}
                            className={embeddedMode ? "w-full sm:w-auto min-w-[120px]" : "w-full sm:w-auto"}
                            variant="outline"
                        >
                            Cancelar
                        </Button>
                    )}
                    <Button
                        type="submit"
                        className={embeddedMode ? "flex w-full items-center justify-center gap-2 sm:w-auto sm:min-w-[220px]" : "flex w-full items-center justify-center gap-2"}
                        disabled={loading || loadingUsuarios || loadingEquipos}
                    >
                        {loading ? "Creando orden..." : "Crear Orden de Trabajo"}
                    </Button>
                </div>
            </div>
        </form>
    );

    return (
        <>
            {embeddedMode ? (
                <div className="max-h-[75vh] overflow-y-auto px-3 pb-2 pr-5 sm:px-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[scrollbar-color:#475569_transparent] dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
                    <div className="mb-3 border-b border-gray-200 pb-3 pr-12 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crear Nueva Orden de Trabajo</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Complete los datos para registrar la orden sin salir de esta vista.
                        </p>
                    </div>
                    {formContent}
                </div>
            ) : (
                <ComponentCard title="Crear Nueva Orden de Trabajo">{formContent}</ComponentCard>
            )}

            <AgregarClienteModal
                isOpen={isClienteModalOpen}
                onClose={() => setIsClienteModalOpen(false)}
                onSuccess={handleClienteCreado}
            />

            <AgregarEquipoModal
                isOpen={isEquipoModalOpen}
                onClose={() => setIsEquipoModalOpen(false)}
                onSuccess={handleEquipoCreado}
            />
        </>
    );
}