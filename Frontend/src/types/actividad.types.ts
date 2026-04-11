export interface TipoActividadTecnica {
  id: number;
  nombre: string;
  estado: boolean;
}

export interface OrderActividad {
  id: number;
  workOrderNumber: string;
  equipo?: {
    nombre: string;
  };
  cliente?: {
    nombre: string;
    apellido: string;
  };
}

export interface ActividadTecnica {
  id: number;
  diagnostico: string;
  trabajoRealizado: string;
  fecha: string;
  estado: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  orden: OrderActividad;
  tipoActividad: TipoActividadTecnica;
}
