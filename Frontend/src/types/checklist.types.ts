export interface ChecklistTemplate {
  id: number;
  nombre: string;
  tipoEquipoId: number;
  tipoEquipo?: {
    id: number;
    nombre: string;
  };
  items: any;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// TIPOS LEGADOS (V1) - PRESERVACIÓN HISTÓRICA
// ==========================================
export type FuncionalStatus = 'operativo' | 'parcial' | 'no_operativo' | 'n/a';
export type EsteticaStatus = 'bueno' | 'regular' | 'dañada' | 'n/a';

export interface ChecklistItemResult {
  item: string;
  funcional: FuncionalStatus;
  estetica: EsteticaStatus;
  observaciones?: string;
}

export interface ChecklistData {
  results: ChecklistItemResult[];
  fechaPeritaje: string;
}

// ==========================================
// NUEVOS TIPOS (V2) - INSPECCIÓN MODERNA Y SEGURA
// ==========================================
export type EstadoEncendido = 'no_probado' | 'correcto' | 'falla' | 'intermitente';

export type EstadoFisico = 'no_revisado' | 'bueno' | 'desgaste' | 'danado' | 'roto' | 'no_aplica';

export type EstadoFuncional = 'no_probado' | 'funciona' | 'falla' | 'intermitente' | 'no_aplica';

export interface InspeccionItemFisico {
  item: string;
  estado: EstadoFisico; // default: 'no_revisado'
  observaciones?: string;
}

export interface InspeccionItemFuncional {
  item: string;
  estado: EstadoFuncional; // default: 'no_probado'
  observaciones?: string;
}

export interface InspeccionRecepcionData {
  fecha: string;
  responsable?: string;
  estadoEncendido: EstadoEncendido;
  observacionGeneral?: string;
  fisica: InspeccionItemFisico[];
  funcional: InspeccionItemFuncional[];
}

export interface AutorizacionClienteData {
  autorizado: boolean;
  medio?: 'Llamada telefónica' | 'WhatsApp' | 'Presencial en mostrador' | 'Correo electrónico';
  fechaAutorizacion?: string;
  contacto?: string;
  detalles?: string;
}

export interface InspeccionComplementariaData {
  fecha: string;
  responsableId?: number;
  responsableNombre?: string;
  motivoEscalamiento: string;
  autorizacionCliente?: AutorizacionClienteData;
  estadoEncendido?: EstadoEncendido;
  fisica?: InspeccionItemFisico[];
  funcional?: InspeccionItemFuncional[];
  observacionesTecnicas?: string;
}

export interface ChecklistDataV2 {
  version: 2;
  tipoOrden: 'EXPRESS' | 'COMPLETA';
  inspeccionRecepcion?: InspeccionRecepcionData;
  inspeccionComplementaria?: InspeccionComplementariaData;
}

/**
 * Determina si los datos de checklist corresponden a la versión moderna V2
 */
export function isChecklistV2(data: any): data is ChecklistDataV2 {
  return Boolean(data && data.version === 2);
}

/**
 * Determina si los datos corresponden al formato legado V1
 */
export function isChecklistV1(data: any): data is ChecklistData {
  return Boolean(data && Array.isArray(data.results));
}

