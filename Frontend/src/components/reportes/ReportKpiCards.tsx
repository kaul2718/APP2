'use client';

import React from 'react';
import { ReportKpi } from './types';

interface ReportKpiCardsProps {
  kpis: ReportKpi[];
  isLoading?: boolean;
}

export const ReportKpiCards: React.FC<ReportKpiCardsProps> = ({ kpis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 h-24 flex flex-col justify-between"
          >
            <div className="h-3 w-24 bg-gray-700 rounded" />
            <div className="h-7 w-16 bg-gray-600 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!kpis || kpis.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" role="region" aria-label="Indicadores clave del reporte">
      {kpis.slice(0, 4).map((kpi, idx) => (
        <div
          key={idx}
          className="bg-gray-800/90 border border-gray-700/70 rounded-xl p-4 shadow-sm hover:border-blue-500/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
        >
          <span className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
            {kpi.label}
          </span>
          <div className="mt-2 flex items-baseline">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
              {kpi.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
