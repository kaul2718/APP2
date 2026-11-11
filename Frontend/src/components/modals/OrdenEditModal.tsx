'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Order } from '@/interfaces/order';
import { useUsuario } from '@/hooks/useUsuario';
import { useEstadoOrden } from '@/hooks/useEstadoOrden';
import { useCasillero } from '@/hooks/useCasillero';
import { useOrders } from '@/hooks/useOrders';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Role } from '@/types/role';
import { useSession } from 'next-auth/react';
import Label from '../form/Label';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/lib/api';
import { saveSafeDraft, getSafeDraft, clearSafeDraft } from '@/lib/formDraftHelper';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  hasSignedReception?: boolean;
  onSave: (updatedData: {
    technicianId?: number | null;
    estadoOrdenId?: number | null;
    problemaReportado?: string;
    fechaPrometidaEntrega?: string | null;
    accesorios?: string[];
    casilleroId?: number | null;
    esperaRepuesto?: boolean;
    tiempoEstimadoReparacion?: number;
    version?: number;
  }) => Promise<boolean | { success: boolean; conflict?: boolean; message?: string }>;
}

export default function OrdenEditModal({ isOpen, onClose, order, hasSignedReception = false, onSave }: Props) {
  const { data: session } = useSession();
  const token = session?.accessToken || null;
  const { usuarios, loading: loadingUsuarios } = useUsuario({ defaultLimit: 1000, defaultRole: Role.TECH });
  const { estadosOrden, loading: loadingEstados } = useEstadoOrden();
  const { casilleros, fetchAvailableCasilleros, loading: loadingCasilleros } = useCasillero();
  const { getTechniciansAvailability } = useOrders();
  const [techAvailability, setTechAvailability] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    technicianId: '',
    estadoOrdenId: '',
    problemaReportado: '',
    fechaPrometidaEntrega: '',
    accesorios: '',
    casilleroId: '',
    esperaRepuesto: false,
    tiempoEstimadoReparacion: '0'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [concurrencyConflict, setConcurrencyConflict] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [serverVersionData, setServerVersionData] = useState<any | null>(null);

  useEffect(() => {
    if (order) {
      setCurrentVersion((order as any).version || 1);
      setConcurrencyConflict(null);
      setServerVersionData(null);
      setFormData({
        technicianId: order.technician?.id?.toString() || '',
        estadoOrdenId: order.estadoOrden?.id?.toString() || '',
        problemaReportado: order.problemaReportado || '',
        fechaPrometidaEntrega: order.fechaPrometidaEntrega
          ? format(new Date(order.fechaPrometidaEntrega), "yyyy-MM-dd'T'HH:mm")
          : '',
        accesorios: order.accesorios?.join(', ') || '',
        casilleroId: order.casillero?.id?.toString() || '',
        esperaRepuesto: order.esperaRepuesto || false,
        tiempoEstimadoReparacion: order.tiempoEstimadoReparacion?.toString() || '0'
      });

      // Cargar casilleros disponibles al abrir el modal
      if (isOpen) {
        // Verificar si existe un borrador previo no guardado por expiración
        const draft = getSafeDraft<typeof formData>(`order_edit_${order.id}`);
        if (draft) {
          setFormData(prev => ({ ...prev, ...draft }));
          clearSafeDraft(`order_edit_${order.id}`);
          toast.info('Se restauraron los cambios de texto que tenías antes de que expirara la sesión.', {
            toastId: 'draft-restored',
          });
        }

        fetchAvailableCasilleros();
        getTechniciansAvailability().then(data => {
          setTechAvailability(data || []);
        });
      }
    }
  }, [order, isOpen]);

  // Resguardar borrador seguro ante evento de expiración de sesión
  useEffect(() => {
    if (!isOpen || !order?.id) return;

    const handleSessionExpired = () => {
      saveSafeDraft(`order_edit_${order.id}`, formData);
    };

    window.addEventListener('hc:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('hc:session-expired', handleSessionExpired);
    };
  }, [isOpen, order?.id, formData]);

  const handleReloadServerVersion = async () => {
    if (!order?.id || !session) return;
    try {
      const fresh = await apiRequest<Order>(`/orders/${order.id}`, {}, session);
      if (fresh) {
        setCurrentVersion((fresh as any).version || 1);
        setServerVersionData({
          problemaReportado: fresh.problemaReportado,
          accesorios: fresh.accesorios?.join(', ') || '',
          tiempoEstimadoReparacion: fresh.tiempoEstimadoReparacion?.toString() || '0',
          fechaPrometidaEntrega: fresh.fechaPrometidaEntrega,
        });
      }
    } catch (e) {
      // Ignorar error de consulta silenciosa
    }
  };

  const handleForceSaveWithNewVersion = async () => {
    if (!order?.id || !session) return;
    try {
      setIsSubmitting(true);
      const fresh = await apiRequest<Order>(`/orders/${order.id}`, {}, session);
      const newVersion = (fresh as any).version || 1;
      setCurrentVersion(newVersion);

      const updatedData = {
        estadoOrdenId: formData.estadoOrdenId ? parseInt(formData.estadoOrdenId) : undefined,
        problemaReportado: formData.problemaReportado,
        fechaPrometidaEntrega: formData.fechaPrometidaEntrega ? formData.fechaPrometidaEntrega : null,
        accesorios: formData.accesorios
          ? formData.accesorios.split(',').map(item => item.trim()).filter(item => item)
          : undefined,
        technicianId: formData.technicianId ? parseInt(formData.technicianId) : null,
        casilleroId: formData.casilleroId ? parseInt(formData.casilleroId) : undefined,
        esperaRepuesto: formData.esperaRepuesto,
        tiempoEstimadoReparacion: parseFloat(formData.tiempoEstimadoReparacion) || 0,
        version: newVersion,
      };

      const result = await onSave(updatedData);
      const isSuccess = result === true || (result && (result as any).success);
      if (isSuccess) {
        clearSafeDraft(`order_edit_${order?.id}`);
        setConcurrencyConflict(null);
        toast.success("Orden actualizada correctamente con la versión sincronizada");
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedData = {
        estadoOrdenId: formData.estadoOrdenId ? parseInt(formData.estadoOrdenId) : undefined,
        problemaReportado: formData.problemaReportado,
        fechaPrometidaEntrega: formData.fechaPrometidaEntrega ? formData.fechaPrometidaEntrega : null,
        accesorios: formData.accesorios
          ? formData.accesorios.split(',').map(item => item.trim()).filter(item => item)
          : undefined,
        technicianId: formData.technicianId ? parseInt(formData.technicianId) : null,
        casilleroId: formData.casilleroId ? parseInt(formData.casilleroId) : undefined,
        esperaRepuesto: formData.esperaRepuesto,
        tiempoEstimadoReparacion: parseFloat(formData.tiempoEstimadoReparacion) || 0,
        version: currentVersion,
      };

      const result = await onSave(updatedData);
      const isSuccess = result === true || (result && (result as any).success);
      if (isSuccess) {
        clearSafeDraft(`order_edit_${order?.id}`);
        toast.success("Orden actualizada correctamente");
        onClose();
      } else if (result && (result as any).conflict) {
        setConcurrencyConflict((result as any).message || 'Conflicto de concurrencia: Otro usuario modificó esta orden.');
        void handleReloadServerVersion();
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar orden");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  const tecnicos = React.useMemo(() =>
    usuarios.filter(usuario => usuario.role === Role.TECH && usuario.estado),
    [usuarios]
  );

  const estadosActivos = estadosOrden.filter(estado => estado.estado);

  // Filtrar casilleros disponibles o asignados a esta orden
  const casillerosDisponibles = React.useMemo(() =>
    casilleros.filter(c =>
      c.situacion === 'Disponible' ||
      (c.order && c.order.id === order.id)
    ),
    [casilleros, order]
  );

  const isReceptionLocked = Boolean(
    hasSignedReception ||
    (order as any)?.documentos?.some(
      (d: any) => d.tipoDocumento === 'RECEPCION' && d.estadoFirma === 'FIRMADO'
    )
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Orden #${order.workOrderNumber}`}
      className="max-w-2xl"
    >

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Banner de Resolución de Conflicto de Concurrencia (Escenario A) */}
        {concurrencyConflict && (
          <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/90 dark:border-rose-900/60 dark:bg-rose-950/40 space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <div>
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Modificación Concurrente Detectada (HTTP 409)
                </h4>
                <p className="text-xs text-rose-800/90 dark:text-rose-300/80 mt-0.5">
                  Otro usuario guardó cambios en esta orden mientras editabas. <strong>Tus modificaciones se han conservado intactas en este formulario</strong>. Puedes revisarlas o aplicar tus cambios sincronizando la versión.
                </p>
              </div>
            </div>

            {serverVersionData && (
              <div className="rounded-lg bg-white/70 dark:bg-gray-800/80 p-3 text-xs border border-rose-200 dark:border-rose-800/50 space-y-1">
                <div className="font-semibold text-gray-700 dark:text-gray-300">Versión actual en servidor:</div>
                <div className="text-gray-600 dark:text-gray-400">
                  • <strong>Problema:</strong> {serverVersionData.problemaReportado || '(Vacío)'}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  • <strong>Accesorios:</strong> {serverVersionData.accesorios || '(Ninguno)'}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleForceSaveWithNewVersion}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition"
              >
                Aplicar mis cambios con la nueva versión
              </button>
              <button
                type="button"
                onClick={() => {
                  if (serverVersionData) {
                    setFormData(prev => ({
                      ...prev,
                      problemaReportado: serverVersionData.problemaReportado,
                      accesorios: serverVersionData.accesorios,
                    }));
                    setConcurrencyConflict(null);
                    toast.info("Campos del formulario actualizados con los datos del servidor.");
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-50"
              >
                Aceptar versión del servidor
              </button>
            </div>
          </div>
        )}

        {/* Técnico asignado */}
        {session?.user?.role !== 'tech' && (
          <div>
            <label htmlFor="edit-technicianId" className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
              Técnico Asignado
            </label>
            <select
              id="edit-technicianId"
              name="technicianId"
              value={formData.technicianId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium"
              disabled={loadingUsuarios}
            >
              <option value="">Seleccione un técnico</option>
              {tecnicos.map(tecnico => {
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
          </div>
        )}

        {/* En espera de repuestos */}
        <div className="flex items-center space-x-3 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30">
          <input
            type="checkbox"
            id="esperaRepuesto"
            name="esperaRepuesto"
            checked={formData.esperaRepuesto}
            onChange={(e) => setFormData(prev => ({ ...prev, esperaRepuesto: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
          <label htmlFor="esperaRepuesto" className="font-medium text-amber-800 dark:text-amber-400 text-sm cursor-pointer select-none">
            Marcar ODS en "Espera de Repuestos" (Pausa el conteo del tiempo de espera y libera la agenda del técnico)
          </label>
        </div>

        {/* Tiempo estimado de reparación y Fecha Estimada de Entrega */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tiempo estimado de reparación */}
          <div>
            <label htmlFor="edit-tiempoEstimado" className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
              Horas Estimadas de Reparación
            </label>
            <input
              id="edit-tiempoEstimado"
              type="number"
              name="tiempoEstimadoReparacion"
              value={formData.tiempoEstimadoReparacion}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ej: 2.5"
            />
          </div>

          {/* Fecha prometida de entrega */}
          <div>
            <Label htmlFor="edit-fechaEntrega" className="mb-2 block">Fecha Estimada de Entrega</Label>
            <div className="relative">
              <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" aria-hidden="true" />
              <input
                id="edit-fechaEntrega"
                type="datetime-local"
                name="fechaPrometidaEntrega"
                value={formData.fechaPrometidaEntrega}
                onChange={(e) => handleChange(e)}
                className="w-full pl-10 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Estado de la orden (Eliminado para respetar el flujo estricto) */}        {/* Casillero - Siempre visible */}
        <div>
          <label htmlFor="edit-casilleroId" className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
            Asignar Casillero
          </label>
          <select
            id="edit-casilleroId"
            name="casilleroId"
            value={formData.casilleroId}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={loadingCasilleros}
          >
            <option value="">Seleccione un casillero</option>
            {casillerosDisponibles.map(casillero => (
              <option
                key={casillero.id}
                value={casillero.id}
                disabled={casillero.situacion === 'Ocupado' && casillero.order?.id !== order.id}
              >
                {casillero.codigo} - {casillero.descripcion}
                {casillero.situacion === 'Ocupado' && casillero.order?.id === order.id && ' (Asignado)'}
                {casillero.situacion === 'Ocupado' && casillero.order?.id !== order.id && ' (Ocupado)'}
              </option>
            ))}
          </select>
        </div>

        {/* Problema reportado */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="edit-problemaReportado" className="font-medium text-gray-700 dark:text-gray-200">
              Problema Reportado
            </label>
            {isReceptionLocked && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                🔒 Sellado por Acta de Recepción
              </span>
            )}
          </div>
          <textarea
            id="edit-problemaReportado"
            name="problemaReportado"
            value={formData.problemaReportado}
            onChange={handleChange}
            readOnly={isReceptionLocked}
            className={`w-full p-2 border rounded-md dark:text-white min-h-[100px] ${
              isReceptionLocked
                ? 'bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed select-none'
                : 'border-gray-300 dark:bg-gray-700 dark:border-gray-600'
            }`}
            required
          />
          {isReceptionLocked && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              El cliente firmó la recepción con esta declaración de falla. Nuevos diagnósticos deben agregarse en Actividades Técnicas.
            </p>
          )}
        </div>

        {/* Accesorios */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="edit-accesorios" className="font-medium text-gray-700 dark:text-gray-200">
              Accesorios (separados por comas)
            </label>
            {isReceptionLocked && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                🔒 Protegido por Acta
              </span>
            )}
          </div>
          <input
            id="edit-accesorios"
            type="text"
            name="accesorios"
            value={formData.accesorios}
            onChange={handleChange}
            readOnly={isReceptionLocked}
            className={`w-full p-2 border rounded-md dark:text-white ${
              isReceptionLocked
                ? 'bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed select-none'
                : 'border-gray-300 dark:bg-gray-700 dark:border-gray-600'
            }`}
            placeholder="Ejemplo: Cargador, Funda, Cable HDMI"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
