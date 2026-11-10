import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EstadoOrdenEnum, EstadoOrdenKey } from '../../common/enums/order-status.enum';
import { EstadoOrden } from '../../estado-orden/entities/estado-orden.entity';
import { Order } from '../entities/order.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Normaliza cualquier nombre o texto de estado a una clave canónica de los 5 estados principales.
 */
export function normalizeToCanonicalKey(name?: string | null): EstadoOrdenKey | null {
  if (!name) return null;
  const norm = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (norm.includes('recep') || norm.includes('ingres')) {
    return 'recepcion';
  }
  if (norm.includes('diagn') || norm.includes('evalua')) {
    return 'diagnostico';
  }
  if (norm.includes('servicio') || norm.includes('repar') || norm.includes('taller')) {
    return 'en_servicio';
  }
  if (norm.includes('listo') || norm.includes('control') || norm.includes('calidad')) {
    return 'listo_para_entrega';
  }
  if (norm.includes('entregad') || norm.includes('entreg') || norm.includes('archiv')) {
    return 'entregado';
  }

  return null;
}

/**
 * Matriz estricta de transiciones permitidas en el nuevo flujo de 5 estados:
 * 1. Recepción
 * 2. Diagnóstico
 * 3. En Servicio
 * 4. Listo para Entrega
 * 5. Entregado (Estado final cerrado)
 */
export const ALLOWED_TRANSITIONS: Record<EstadoOrdenKey, EstadoOrdenKey[]> = {
  recepcion: ['diagnostico', 'en_servicio', 'listo_para_entrega', 'entregado'],
  diagnostico: ['en_servicio', 'listo_para_entrega', 'recepcion'],
  en_servicio: ['listo_para_entrega', 'diagnostico'],
  listo_para_entrega: ['entregado', 'en_servicio', 'diagnostico'],
  entregado: [], // Estado final cerrado. Solo admin puede rectificar
};

/**
 * Matriz de transiciones autorizadas por rol operativo:
 */
export const ROLE_TRANSITIONS: Record<'tech' | 'recep', Partial<Record<EstadoOrdenKey, EstadoOrdenKey[]>>> = {
  tech: {
    recepcion: ['diagnostico', 'en_servicio'],
    diagnostico: ['en_servicio', 'listo_para_entrega', 'recepcion'],
    en_servicio: ['listo_para_entrega', 'diagnostico'],
    listo_para_entrega: ['en_servicio', 'diagnostico', 'entregado'],
  },
  recep: {
    recepcion: ['listo_para_entrega', 'entregado'], // Cancelación / devolución en mostrador sin servicio
    listo_para_entrega: ['entregado'], // Entrega física final en mostrador
  },
};

export interface ValidateTransitionOptions {
  estadoActual: EstadoOrden | null | undefined;
  nuevoEstado: EstadoOrden;
  usuario?: User | null;
  orden?: Order | null;
  motivo?: string;
}

/**
 * Motor centralizado de validación de transiciones de órdenes de servicio (5 Estados).
 * Valida rol, reglas de negocio de presupuesto, repuestos y checklist de calidad.
 */
export function validateOrderTransition({
  estadoActual,
  nuevoEstado,
  usuario,
  orden,
  motivo,
}: ValidateTransitionOptions): {
  claveActual: EstadoOrdenKey;
  claveDestino: EstadoOrdenKey;
  esLiberador: boolean;
} {
  if (!estadoActual || estadoActual.id === nuevoEstado.id) {
    const key = normalizeToCanonicalKey(nuevoEstado.nombre) || 'recepcion';
    return {
      claveActual: key,
      claveDestino: key,
      esLiberador: key === 'entregado',
    };
  }

  const claveActual = normalizeToCanonicalKey(estadoActual.nombre);
  if (!claveActual) {
    throw new BadRequestException(
      `Estado actual no reconocido: "${estadoActual.nombre}" no pertenece al flujo oficial de 5 estados.`,
    );
  }

  const claveDestino = normalizeToCanonicalKey(nuevoEstado.nombre);
  if (!claveDestino) {
    throw new BadRequestException(
      `Estado destino no reconocido: "${nuevoEstado.nombre}" no pertenece al flujo oficial de 5 estados.`,
    );
  }

  if (claveActual === claveDestino) {
    return {
      claveActual,
      claveDestino,
      esLiberador: claveDestino === 'entregado',
    };
  }

  const userRoles = (usuario?.userRoles || []).map((ur: any) => ur.rol?.slug).filter(Boolean);
  const isAdmin = userRoles.includes('admin');
  const isTech = userRoles.includes('tech');
  const isRecep = userRoles.includes('recep');

  // 1. Estado final cerrado: Entregado
  if (claveActual === 'entregado' && !isAdmin) {
    throw new ForbiddenException(
      'Una orden en estado Entregado está cerrada operativamente. Solo un administrador puede rectificarla.',
    );
  }

  // 2. Validación de matriz de transiciones permitidas
  const destinosPermitidos = ALLOWED_TRANSITIONS[claveActual] || [];
  if (!destinosPermitidos.includes(claveDestino) && !isAdmin) {
    throw new BadRequestException(
      `Transición no permitida: no se puede cambiar de "${estadoActual.nombre}" a "${nuevoEstado.nombre}".`,
    );
  }

  // 3. Validación de permisos por rol operativo (si no es admin)
  if (!isAdmin) {
    let permitidaPorRol = false;
    if (isTech && ROLE_TRANSITIONS.tech[claveActual]?.includes(claveDestino)) {
      permitidaPorRol = true;
    }
    if (isRecep && ROLE_TRANSITIONS.recep[claveActual]?.includes(claveDestino)) {
      permitidaPorRol = true;
    }

    if (!permitidaPorRol) {
      throw new ForbiddenException(
        `Tu rol de usuario no tiene permisos para realizar la transición de "${estadoActual.nombre}" a "${nuevoEstado.nombre}".`,
      );
    }
  }

  // 4. Reglas de negocio obligatorias sobre la Orden
  if (orden) {
    // 4.1. Regla de Aprobación de Presupuesto:
    // No ejecutar trabajos (En Servicio) si el presupuesto está pendiente de autorización
    if (claveDestino === 'en_servicio' && orden.presupuesto) {
      const budgetState = (
        typeof orden.presupuesto.estado === 'object'
          ? orden.presupuesto.estado?.nombre
          : String(orden.presupuesto.estado || '')
      ).toLowerCase();

      if (budgetState.includes('pend')) {
        throw new BadRequestException(
          'No se puede iniciar el servicio técnico: el presupuesto de la orden se encuentra pendiente de aprobación por el cliente.',
        );
      }
      if (budgetState.includes('rechaz') && !isAdmin) {
        throw new BadRequestException(
          'El presupuesto fue rechazado por el cliente. La orden debe resolverse mediante devolución o revisión de propuesta.',
        );
      }
    }

    // 4.2. Regla de Repuestos pendientes:
    // No avanzar a Listo para Entrega si todavía está en espera de repuesto
    if (claveDestino === 'listo_para_entrega') {
      if (orden.esperaRepuesto) {
        throw new BadRequestException(
          'No se puede marcar la orden como Lista para Entrega mientras tenga la condición de "En espera de repuesto" activa.',
        );
      }

      // 4.3. Regla de Validación Técnica / Control de Calidad:
      // Validar que el checklist asignado no esté incompleto
      if (orden.checklistData && orden.checklistData.results && Array.isArray(orden.checklistData.results)) {
        const hasUncheckedMandatory = orden.checklistData.results.some(
          (item: any) => item.requerido && item.estado === 'pendiente',
        );
        if (hasUncheckedMandatory) {
          throw new BadRequestException(
            'Control de calidad no superado: la orden cuenta con verificaciones de checklist técnico pendientes.',
          );
        }
      }
    }
  }

  // 4.4. Regla de Cierre Directo / Cancelación desde Recepción:
  // No permitir que una transición directa desde Recepción hasta Entregado omita las validaciones de devolución y cierre correspondientes.
  if (claveActual === 'recepcion' && claveDestino === 'entregado') {
    if (!motivo || motivo.trim().length < 5) {
      throw new BadRequestException(
        'Para cerrar o devolver una orden directamente desde Recepción a Entregado sin pasar por servicio técnico, debe ingresar obligatoriamente un motivo o justificación de al menos 5 caracteres.',
      );
    }
  }

  return {
    claveActual,
    claveDestino,
    esLiberador: claveDestino === 'entregado',
  };
}
