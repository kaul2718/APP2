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

export interface ActividadTecnica {
  id: number;
  diagnostico: string;
  trabajoRealizado: string;
  fecha: string;
  tipoActividad: {
    id: number;
    nombre: string;
  };
}

export interface Presupuesto {
  id: number;
  fechaEmision: string;
  descripcion?: string;
  estado: {
    id: number;
    nombre: string;
  };
}

export interface DetalleRepuesto {
  id: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  repuesto: {
    id: number;
    nombre: string;
    codigo: string;
  };
}

export interface EvidenciaTecnica {
  id: number;
  urlImagen: string;
  descripcion?: string;
  fechaSubida: string;
}

export interface HistorialEstado {
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
  actividades?: ActividadTecnica[];
  presupuesto?: Presupuesto;
  detallesRepuestos?: DetalleRepuesto[];
  casillero?: {
    id: number;
    codigo: string;
    descripcion: string;
  };
  evidencias?: EvidenciaTecnica[];
  historialEstados?: HistorialEstado[];
}