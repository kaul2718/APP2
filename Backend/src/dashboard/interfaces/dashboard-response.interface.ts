export type DashboardRole = 'admin' | 'tech' | 'recep' | 'client';

export interface DashboardKpi {
  key: string;
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
  variation?: number;
  subtitle?: string;
  color?: string;
  actionUrl?: string;
}

export interface DashboardChartSeries {
  name: string;
  data: number[];
}

export interface DashboardChart {
  key: string;
  title: string;
  categories: string[];
  series: DashboardChartSeries[];
  total?: number;
}

export interface DashboardRecentItem {
  id: number;
  title: string;
  subtitle: string;
  status: string;
  createdAt: Date;
  path?: string;
  tecnico?: string;
}

export interface DashboardAlert {
  id: string;
  title?: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  count?: number;
  actionUrl?: string;
  actionLabel?: string;
}

export interface TurnaroundTimeStat {
  tipoOrden: string;
  horasPromedio: number;
  diasPromedio: number;
  muestra: number;
}

export interface TechnicianWorkloadStat {
  id: number;
  nombre: string;
  asignadasActivas: number;
  completadasPeriodo: number;
}

export interface DashboardResponse {
  role: DashboardRole;
  range: string;
  generatedAt: string;
  kpis: DashboardKpi[];
  charts: DashboardChart[];
  recent: DashboardRecentItem[];
  alerts: DashboardAlert[];
  turnaroundTimes?: TurnaroundTimeStat[];
  technicianWorkloads?: TechnicianWorkloadStat[];
}
