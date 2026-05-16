export enum OrderType {
  EXPRESS = 'EXPRESS',
  COMPLETA = 'COMPLETA',
}

export interface UserBasic {
  id: number;
  nombre: string;
  apellido?: string;
  role: string;
}

export interface EquipoBasic {
  id: number;
  numeroSerie: string;
  tipoEquipo?: {
    id: number;
    nombre: string;
  };
  marca?: {
    id: number;
    nombre: string;
  };
  modelo?: {
    id: number;
    nombre: string;
  };
}

export interface EstadoOrdenBasic {
  id: number;
  nombre: string;
}

export interface OrderActividad {
  id: number;
  diagnostico: string;
  trabajoRealizado: string;
  fecha: string;
  tipoActividad: {
    id: number;
    nombre: string;
  };
}

export interface OrderPresupuesto {
  id: number;
  fechaEmision: string;
  descripcion?: string;
  estado: {
    id: number;
    nombre: string;
  };
  estadoId: number;
  detallesPresupuestoItems?: OrderDetallePresupuestoItem[];
  detallesManoObra?: OrderDetalleManoObra[];
  deletedAt?: string | null;
}

export interface OrderDetalleManoObra {
  id: number;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  estado?: boolean;
  deletedAt?: string | null;
  tipoManoObra?: {
    id: number;
    nombre: string;
  };
}

export interface OrderDetallePresupuestoItem {
  id: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  estado?: boolean;
  deletedAt?: string | null;
  parte?: {
    id: number;
    nombre: string;
    codigoInterno?: string;
  };
}

export interface OrderEvidenciaTecnica {
  id: number;
  urlImagen?: string;
  archivoUrl?: string;
  actividadId?: number;
  descripcion?: string;
  fechaSubida: string;
}

export interface OrderHistorialEstado {
  id: number;
  fechaCambio: string;
  observaciones?: string;
  estadoOrden: EstadoOrdenBasic;
  usuario: UserBasic;
}

export interface Order {
  id: number;
  workOrderNumber: string;
  estado: boolean;
  client: UserBasic;
  technician?: UserBasic;
  recepcionista?: UserBasic;
  equipo: EquipoBasic;
  problemaReportado: string;
  accesorios?: string[];
  fechaPrometidaEntrega?: string;
  estadoOrden?: EstadoOrdenBasic;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  actividades?: OrderActividad[];
  presupuesto?: OrderPresupuesto;
  detallesPresupuestoItems?: OrderDetallePresupuestoItem[];
  casillero?: {
    id: number;
    codigo: string;
    descripcion: string;
  };
  evidencias?: OrderEvidenciaTecnica[];
  historialEstados?: OrderHistorialEstado[];
  tipoOrden: OrderType;
  checklistData?: any;
}
