export interface ChecklistTemplate {
  id: number;
  nombre: string;
  tipoEquipoId: number;
  tipoEquipo?: {
    id: number;
    nombre: string;
  };
  items: string[];
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}

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
