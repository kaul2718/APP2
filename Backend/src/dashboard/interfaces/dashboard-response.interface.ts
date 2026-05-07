export type DashboardRole = 'admin' | 'tech' | 'recep' | 'client';

export interface DashboardKpi {
  key: string;
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
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
}

export interface DashboardRecentItem {
  id: number;
  title: string;
  subtitle: string;
  status: string;
  createdAt: Date;
  path?: string;
}

export interface DashboardAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface DashboardResponse {
  role: DashboardRole;
  range: string;
  generatedAt: string;
  kpis: DashboardKpi[];
  charts: DashboardChart[];
  recent: DashboardRecentItem[];
  alerts: DashboardAlert[];
}
