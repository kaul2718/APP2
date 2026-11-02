"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { DashboardChart } from "@/types/dashboard.types";
import { ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface OrdersEvolutionChartProps {
  chart?: DashboardChart;
}

export default function OrdersEvolutionChart({ chart }: OrdersEvolutionChartProps) {
  const categories = chart?.categories || [];
  const series = chart?.series || [
    { name: "Ingresadas", data: [] },
    { name: "Entregadas", data: [] },
  ];

  const hasData = series.some((s) => s.data.some((val) => val > 0));

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area",
      toolbar: { show: false },
      background: "transparent",
    },
    colors: ["#465FFF", "#F59E0B"],
    stroke: {
      curve: "smooth",
      width: [2.5, 2.5],
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 95, 100],
      },
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      strokeColors: ["#465FFF", "#F59E0B"],
      hover: { size: 6 },
    },
    grid: {
      borderColor: "rgba(107, 114, 128, 0.15)",
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
      fontWeight: 600,
      labels: {
        colors: "#9CA3AF",
      },
      markers: {
        size: 6,
      },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          fontSize: "11px",
          fontWeight: 500,
          colors: "#9CA3AF",
        },
      },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: {
        style: {
          fontSize: "11px",
          colors: "#9CA3AF",
        },
        formatter: (val) => Math.round(val).toString(),
      },
    },
    tooltip: {
      theme: "dark",
      x: { show: true },
      y: {
        formatter: (val) => `${val} órdenes`,
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-500/10 rounded-xl border border-brand-500/20">
            <ArrowTrendingUpIcon className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {chart?.title || "Ingresadas vs. Entregadas"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Comparativa de flujo de entrada y salida del taller
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[290px]">
        {hasData || categories.length > 0 ? (
          <div className="w-full">
            <ReactApexChart options={options} series={series} type="area" height={290} />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No hay movimientos registrados en el período seleccionado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
