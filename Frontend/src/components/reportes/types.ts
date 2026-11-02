export type ReportType =
  | 'orders'
  | 'delivered'
  | 'delayed'
  | 'budgets'
  | 'inventory'
  | 'techs'
  | 'clients'
  | 'purchases';

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'week'
  | 'month'
  | 'last_month'
  | 'year'
  | 'all'
  | 'custom';

export interface ReportFilterState {
  reportType: ReportType;
  preset: DatePreset;
  startDate: string;
  endDate: string;
  tecnicoId: string;
  estadoId: string;
  tipoOrden: string;
  filtroStock: string;
  tipoItem?: 'productos' | 'servicios' | 'todos';
  search: string;
  page: number;
  limit: number;
}

export interface ReportKpi {
  label: string;
  value: string | number;
}

export interface ReportFilterOptions {
  estados: { id: number; label: string }[];
  tecnicos: { id: number; label: string }[];
  estadosPresupuesto: { id: number; label: string }[];
  tiposOrden: { id: string; label: string }[];
  filtrosStock: { id: string; label: string }[];
}
