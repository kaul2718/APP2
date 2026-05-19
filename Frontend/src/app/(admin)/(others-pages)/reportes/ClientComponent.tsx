'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import {
  UsersIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  WrenchScrewdriverIcon,
  ComputerDesktopIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
  ShoppingBagIcon,
  PrinterIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface KPIStats {
  ordersCount: number;
  budgetsCount: number;
  purchasesCount: number;
  clientsCount: number;
  revenue: number;
  expenses: number;
}

interface ClientReport {
  id: number;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  ordersCount: number;
}

interface InventoryReport {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  activo: boolean;
}

interface PurchaseReport {
  id: number;
  numeroFactura: string;
  fecha: string;
  total: number;
  proveedor: string;
  comprador: string;
  estado: string;
}

interface BudgetReport {
  id: number;
  fecha: string;
  descripcion: string;
  estado: string;
  orden: string;
  cliente: string;
  total: number;
}

interface OrderReport {
  id: number;
  workOrderNumber: string;
  cliente: string;
  tecnico: string;
  estado: string;
  fechaIngreso: string;
  fechaPrometida: string;
}

interface TechReport {
  id: number;
  nombreCompleto: string;
  totalAssigned: number;
  servicesGenerated: number;
  partsGenerated: number;
  moneyGenerated: number;
}

interface TechOrderDetailReport {
  id: number;
  workOrderNumber: string;
  cliente: string;
  estado: string;
  fechaIngreso: string;
  servicesGenerated: number;
  partsGenerated: number;
  moneyGenerated: number;
}

interface EquipmentReport {
  brand: string;
  count: number;
}

type TabType = 'clients' | 'inventory' | 'purchases' | 'budgets' | 'orders' | 'techs' | 'equip';

interface ClientComponentProps {
  initialTab?: TabType;
  standalone?: boolean;
}

export default function ClientComponent({ initialTab, standalone = false }: ClientComponentProps) {
  const { data: session } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const token = session?.accessToken;

  // ─── State ──────────────────────────────────────────────────────────────────
  const [useCalendar, setUseCalendar] = useState<boolean>(false);
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  // Calendarios
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Data states
  const [kpi, setKpi] = useState<KPIStats | null>(null);
  const [clients, setClients] = useState<ClientReport[]>([]);
  const [inventory, setInventory] = useState<InventoryReport[]>([]);
  const [purchases, setPurchases] = useState<PurchaseReport[]>([]);
  const [budgets, setBudgets] = useState<BudgetReport[]>([]);
  const [orders, setOrders] = useState<OrderReport[]>([]);
  
  // Técnicos states (Resumen y Detallado)
  const [techList, setTechList] = useState<{ id: number; nombreCompleto: string }[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [isTechDetail, setIsTechDetail] = useState<boolean>(false);
  const [techs, setTechs] = useState<TechReport[]>([]);
  const [techOrders, setTechOrders] = useState<TechOrderDetailReport[]>([]);

  const [equip, setEquip] = useState<EquipmentReport[]>([]);

  // Synchronize dynamic tab if initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, range, startDate, endDate, itemsPerPage, selectedTechId]);

  // ─── Fetching Data ──────────────────────────────────────────────────────────
  const fetchAllReports = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Cargar lista dropdown de técnicos sólo si no está cargada
      if (activeTab === 'techs' && techList.length === 0) {
        const techListRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/reports/technicians/list`, { headers });
        if (techListRes.ok) {
          const list = await techListRes.json();
          setTechList(list);
        }
      }

      // Query Params
      let queryParams = '';
      if (useCalendar) {
        if (startDate) queryParams += `&startDate=${startDate}`;
        if (endDate) queryParams += `&endDate=${endDate}`;
      } else {
        queryParams += `&range=${range}`;
      }

      // Filtrar por técnico seleccionado en vista de técnicos
      if (activeTab === 'techs' && selectedTechId) {
        queryParams += `&technicianId=${selectedTechId}`;
      }

      const [kpiRes, tabRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/reports/dashboard?${queryParams}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/reports/${activeTab === 'techs' ? 'technicians' : activeTab === 'equip' ? 'equipment' : activeTab}?${queryParams}`, { headers }),
      ]);

      if (!kpiRes.ok || !tabRes.ok) throw new Error('Error al descargar reportes');

      const kpiData = await kpiRes.json();
      const tabData = await tabRes.json();

      setKpi(kpiData);

      if (activeTab === 'clients') setClients(tabData);
      else if (activeTab === 'inventory') setInventory(tabData);
      else if (activeTab === 'purchases') setPurchases(tabData);
      else if (activeTab === 'budgets') setBudgets(tabData);
      else if (activeTab === 'orders') setOrders(tabData);
      else if (activeTab === 'techs') {
        if (tabData.isDetail) {
          setIsTechDetail(true);
          setTechOrders(tabData.orders);
        } else {
          setIsTechDetail(false);
          setTechs(tabData.technicians);
        }
      }
      else if (activeTab === 'equip') setEquip(tabData);

    } catch (err) {
      toast.error('Ocurrió un error al cargar las analíticas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReports();
  }, [token, range, activeTab, useCalendar, startDate, endDate, selectedTechId]);

  // ─── CSV Export Handler ──────────────────────────────────────────────────────
  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `reporte-${activeTab}-${useCalendar ? `${startDate || 'inicio'}_a_${endDate || 'fin'}` : range}.csv`;

    if (activeTab === 'clients') {
      csvContent += 'ID,Nombre Completo,Correo,Telefono,Total Ordenes\n';
      clients.forEach(c => {
        csvContent += `"${c.id}","${c.nombreCompleto}","${c.correo}","${c.telefono}","${c.ordersCount}"\n`;
      });
    } else if (activeTab === 'inventory') {
      csvContent += 'ID,Codigo,Nombre,Categoria,Stock,Stock Minimo,Precio,Activo\n';
      inventory.forEach(i => {
        csvContent += `"${i.id}","${i.codigo}","${i.nombre}","${i.categoria}","${i.stock}","${i.stockMinimo}","${i.precio}","${i.activo}"\n`;
      });
    } else if (activeTab === 'purchases') {
      csvContent += 'ID,Factura,Fecha,Proveedor,Comprador,Total,Estado\n';
      purchases.forEach(p => {
        csvContent += `"${p.id}","${p.numeroFactura}","${p.fecha}","${p.proveedor}","${p.comprador}","${p.total}","${p.estado}"\n`;
      });
    } else if (activeTab === 'budgets') {
      csvContent += 'ID,Fecha,Cliente,Orden,Total,Estado\n';
      budgets.forEach(b => {
        csvContent += `"${b.id}","${b.fecha}","${b.cliente}","${b.orden}","${b.total}","${b.estado}"\n`;
      });
    } else if (activeTab === 'orders') {
      csvContent += 'ID,Numero Orden,Cliente,Tecnico,Estado,Fecha Ingreso\n';
      orders.forEach(o => {
        csvContent += `"${o.id}","${o.workOrderNumber}","${o.cliente}","${o.tecnico}","${o.estado}","${o.fechaIngreso}"\n`;
      });
    } else if (activeTab === 'techs') {
      if (isTechDetail) {
        csvContent += 'Código ODS,Cliente,Estado,Mano de Obra (Servicios),Repuestos (Componentes),Total Generado,Fecha\n';
        techOrders.forEach(to => {
          csvContent += `"${to.workOrderNumber}","${to.cliente}","${to.estado}","${to.servicesGenerated}","${to.partsGenerated}","${to.moneyGenerated}","${new Date(to.fechaIngreso).toLocaleDateString()}"\n`;
        });
      } else {
        csvContent += 'ID Técnico,Técnico Responsable,Órdenes Asignadas,Mano de Obra (Servicios),Repuestos (Componentes),Total Facturado\n';
        techs.forEach(t => {
          csvContent += `"${t.id}","${t.nombreCompleto}","${t.totalAssigned}","${t.servicesGenerated}","${t.partsGenerated}","${t.moneyGenerated}"\n`;
        });
      }
    } else if (activeTab === 'equip') {
      csvContent += 'Marca,Cantidad Equipos\n';
      equip.forEach(eq => {
        csvContent += `"${eq.brand}","${eq.count}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reporte exportado en Excel (CSV) correctamente');
  };

  const handlePrint = () => {
    window.print();
  };

  // ─── Strongly-Typed Filter & Pagination Sub-arrays ─────────────────────────
  const filteredClients = clients.filter(c =>
    c.nombreCompleto.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.correo.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredInventory = inventory.filter(i =>
    i.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.codigo.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredPurchases = purchases.filter(p =>
    p.numeroFactura.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.proveedor.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedPurchases = filteredPurchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredBudgets = budgets.filter(b =>
    b.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.orden.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedBudgets = filteredBudgets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredOrders = orders.filter(o =>
    o.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.tecnico.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Técnicos
  const filteredTechs = techs.filter(t =>
    t.nombreCompleto.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedTechs = filteredTechs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredTechOrders = techOrders.filter(to =>
    to.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    to.cliente.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedTechOrders = filteredTechOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredEquip = equip.filter(eq =>
    eq.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedEquip = filteredEquip.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Compute active totals
  const getActiveTotals = () => {
    if (activeTab === 'clients') return filteredClients.length;
    if (activeTab === 'inventory') return filteredInventory.length;
    if (activeTab === 'purchases') return filteredPurchases.length;
    if (activeTab === 'budgets') return filteredBudgets.length;
    if (activeTab === 'orders') return filteredOrders.length;
    if (activeTab === 'techs') {
      return isTechDetail ? filteredTechOrders.length : filteredTechs.length;
    }
    return filteredEquip.length;
  };

  const totalItems = getActiveTotals();
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const getBreadcrumbTitle = () => {
    const labelMap: Record<TabType, string> = {
      clients: 'Reporte de Clientes',
      inventory: 'Reporte de Inventario',
      purchases: 'Reporte de Compras',
      budgets: 'Reporte de Presupuestos',
      orders: 'Reporte de Órdenes',
      techs: 'Rendimiento de Técnicos',
      equip: 'Volumen por Equipos',
    };
    return labelMap[activeTab];
  };

  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!hasPermission("reportes.view")) {
    return (
      <div className="p-10 text-center bg-white dark:bg-gray-900 rounded-lg border border-gray-150 dark:border-gray-800 shadow-theme-xs">
        <h2 className="text-lg font-bold text-red-500">Acceso Denegado</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          No tienes los permisos asignados por el administrador para ver el módulo de Reportes. Por favor, contacta al administrador del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 space-y-6">
      
      {/* Estilos CSS específicos para Impresión limpia / PDF */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, header, nav, .print\\:hidden, button, input, select {
            display: none !important;
          }
          .max-w-screen-2xl {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .lg\\:col-span-9, .lg\\:col-span-12 {
            width: 100% !important;
          }
          .lg\\:col-span-3 {
            display: none !important;
          }
          .shadow-sm, .shadow-md, .shadow-lg {
            box-shadow: none !important;
            border: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border-bottom: 1px solid #ddd !important;
            padding: 8px !important;
          }
        }
      `}</style>

      <div className="print:hidden">
        <PageBreadcrumb pageTitle={standalone ? getBreadcrumbTitle() : "Dashboard General de Reportes"} />
      </div>

      {/* Cabecera exclusiva para versión impresa / PDF */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">HOSPITAL DEL COMPUTADOR</h1>
        <p className="text-xs text-gray-500 font-semibold mt-1">Reporte Consolidado de Negocio y Operaciones</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Fecha de Emisión: {new Date().toLocaleDateString()} | Generado por: {session?.user?.name || 'Administrador'}
        </p>
        <div className="text-[10px] text-gray-500 mt-2 font-mono">
          Módulo: {getBreadcrumbTitle()} | Rango: {useCalendar ? `Desde ${startDate || 'Inicio'} hasta ${endDate || 'Hoy'}` : range === '7d' ? 'Últimos 7 días' : range === '30d' ? 'Últimos 30 días' : range === '90d' ? 'Últimos 90 días' : 'Histórico completo'}
        </div>
      </div>

      {/* ─── Global Filters Bar (print:hidden) ─── */}
      <div className="print:hidden flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        
        {/* Toggle Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Modo de Filtro:</span>
          </div>
          <div className="flex gap-2 bg-gray-50 dark:bg-gray-800/40 p-1.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
            <button
              onClick={() => setUseCalendar(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !useCalendar
                  ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm border border-gray-100 dark:border-gray-700'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              Presets Rápidos
            </button>
            <button
              onClick={() => setUseCalendar(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                useCalendar
                  ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm border border-gray-100 dark:border-gray-700'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              📅 Rango de Calendario
            </button>
          </div>
        </div>

        {/* Inputs correspondientes */}
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 max-w-2xl">
          <div className="w-full">
            <AnimatePresence mode="wait">
              {!useCalendar ? (
                <motion.div
                  key="presets"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex flex-wrap gap-2"
                >
                  {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        range === r
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {r === '7d' ? 'Últimos 7 días' : r === '30d' ? 'Últimos 30 días' : r === '90d' ? 'Últimos 90 días' : 'Todo el tiempo'}
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex flex-col sm:flex-row items-center gap-3 w-full"
                >
                  <div className="relative w-full sm:flex-1">
                    <span className="absolute left-3 top-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider block pointer-events-none">
                      Desde
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker();
                        } catch (err) {}
                      }}
                      className="w-full pl-3 pr-10 pt-5 pb-1 text-xs border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    />
                  </div>
                  <div className="relative w-full sm:flex-1">
                    <span className="absolute left-3 top-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider block pointer-events-none">
                      Hasta
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker();
                        } catch (err) {}
                      }}
                      className="w-full pl-3 pr-10 pt-5 pb-1 text-xs border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={fetchAllReports}
                    className="w-full sm:w-auto px-4 py-3 bg-brand-500 text-white rounded-xl text-xs font-bold hover:bg-brand-600 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Filtrar</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 🛠️ Dropdown Selector de Técnico (Se muestra sólo en la pestaña de Técnicos) */}
          {activeTab === 'techs' && (
            <div className="flex items-center gap-2 border-l pl-4 border-gray-100 dark:border-gray-800 w-full sm:w-auto">
              <span className="text-xs text-gray-400 font-bold whitespace-nowrap">Técnico:</span>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none font-bold text-gray-700 dark:text-gray-300"
              >
                <option value="">Resumen (Todos)</option>
                {techList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombreCompleto}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ─── Executive KPI Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold block">Total Ingresos</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              ${kpi?.revenue?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="print:hidden w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BanknotesIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold block">Total Egresos</span>
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
              ${kpi?.expenses?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="print:hidden w-12 h-12 bg-rose-50 dark:bg-rose-950/40 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShoppingBagIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold block">Órdenes Generadas</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">
              {kpi?.ordersCount || 0}
            </span>
          </div>
          <div className="print:hidden w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ClipboardDocumentCheckIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold block">Clientes Activos</span>
            <span className="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1 block">
              {kpi?.clientsCount || 0}
            </span>
          </div>
          <div className="print:hidden w-12 h-12 bg-brand-50 dark:bg-brand-950/40 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-400">
            <UsersIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── Tabs & Tables Workspace ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Tab Selector (visible only when NOT in standalone mode) */}
        {!standalone && (
          <div className="print:hidden lg:col-span-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 block px-3 uppercase mb-2">
              Módulos Analíticos
            </span>
            {[
              { id: 'clients', label: 'Clientes', icon: UsersIcon },
              { id: 'inventory', label: 'Inventario', icon: ArchiveBoxIcon },
              { id: 'purchases', label: 'Compras', icon: ShoppingBagIcon },
              { id: 'budgets', label: 'Presupuestos', icon: BanknotesIcon },
              { id: 'orders', label: 'Órdenes de Servicio', icon: ClipboardDocumentCheckIcon },
              { id: 'techs', label: 'Técnicos', icon: WrenchScrewdriverIcon },
              { id: 'equip', label: 'Equipos', icon: ComputerDesktopIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                    activeTab === tab.id
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right Side Data Grid Panel */}
        <div className={`${standalone ? 'lg:col-span-12' : 'lg:col-span-9'} bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-4`}>
          
          <div className="hidden print:block border-b pb-2 mb-2">
            <h3 className="text-md font-bold uppercase tracking-wider text-gray-800">
              Módulo: {getBreadcrumbTitle()} {activeTab === 'techs' && selectedTechId && `(Técnico Detallado)`}
            </h3>
          </div>

          <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <input
              type="text"
              placeholder="Buscar dentro de este reporte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:max-w-xs px-4 py-2 text-xs border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-700 dark:text-gray-300"
            />
            
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 text-emerald-600" />
                <span>Exportar Excel (XLS)</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
              >
                <PrinterIcon className="w-4 h-4 text-brand-500" />
                <span>Generar PDF / Imprimir</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-20 flex flex-col items-center justify-center space-y-3 print:hidden"
              >
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-gray-400 font-semibold">Generando reporte consolidado...</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="overflow-x-auto space-y-6"
              >
                {/* 👥 Clientes Table */}
                {activeTab === 'clients' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold">
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Correo</th>
                        <th className="py-3 px-4">Teléfono</th>
                        <th className="py-3 px-4 text-center">Frecuencia ODS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
                      {paginatedClients.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                          <td className="py-3.5 px-4 font-semibold">{c.nombreCompleto}</td>
                          <td className="py-3.5 px-4">{c.correo}</td>
                          <td className="py-3.5 px-4">{c.telefono}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold rounded-lg">
                              {c.ordersCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 📦 Inventario Table */}
                {activeTab === 'inventory' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold">
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Artículo</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4 text-right">Precio (PVP)</th>
                        <th className="py-3 px-4 text-center">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
                      {paginatedInventory.map(i => (
                        <tr key={i.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                          <td className="py-3.5 px-4 font-mono text-gray-500">{i.codigo}</td>
                          <td className="py-3.5 px-4 font-semibold">{i.nombre}</td>
                          <td className="py-3.5 px-4 text-gray-500">{i.categoria}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                            ${i.precio.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 font-bold rounded-lg ${
                                i.stock <= i.stockMinimo
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {i.stock} / {i.stockMinimo}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 💳 Compras Table */}
                {activeTab === 'purchases' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold">
                        <th className="py-3 px-4">Factura No.</th>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Proveedor</th>
                        <th className="py-3 px-4">Efectuado por</th>
                        <th className="py-3 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
                      {paginatedPurchases.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                          <td className="py-3.5 px-4 font-bold">{p.numeroFactura}</td>
                          <td className="py-3.5 px-4 text-gray-500">{new Date(p.fecha).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4 font-semibold">{p.proveedor}</td>
                          <td className="py-3.5 px-4 text-gray-500">{p.comprador}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                            ${p.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 💵 Presupuestos Table */}
                {activeTab === 'budgets' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold">
                        <th className="py-3 px-4">ID Presupuesto</th>
                        <th className="py-3 px-4">Asociado a</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Total Estimado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
                      {paginatedBudgets.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                          <td className="py-3.5 px-4 font-mono text-gray-500">Pres. #{b.id}</td>
                          <td className="py-3.5 px-4 font-bold">{b.orden}</td>
                          <td className="py-3.5 px-4">{b.cliente}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold rounded-md">
                              {b.estado}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ${b.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 🔧 Órdenes de Servicio Table */}
                {activeTab === 'orders' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold">
                        <th className="py-3 px-4">Código ODS</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Técnico Asignado</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Ingreso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
                      {paginatedOrders.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                          <td className="py-3.5 px-4 font-bold">ODS #{o.workOrderNumber}</td>
                          <td className="py-3.5 px-4">{o.cliente}</td>
                          <td className="py-3.5 px-4 text-gray-500 font-semibold">{o.tecnico}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold rounded-md">
                              {o.estado}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">{new Date(o.fechaIngreso).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 🛠️ Técnicos View Grid (Summary OR Detail mode based on selectedTechId) */}
                {activeTab === 'techs' && (
                  <>
                    {isTechDetail ? (
                      /* ─── Detaillado (Trabajos por Técnico) ─── */
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold">
                            <th className="py-3 px-4">Código ODS</th>
                            <th className="py-3 px-4">Cliente</th>
                            <th className="py-3 px-4">Estado</th>
                            <th className="py-3 px-4 text-right">Servicios (Mano de Obra)</th>
                            <th className="py-3 px-4 text-right">Repuestos (Componentes)</th>
                            <th className="py-3 px-4 text-right">Total ODS</th>
                            <th className="py-3 px-4 text-center">Fecha Ingreso</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
                          {paginatedTechOrders.map(to => (
                            <tr key={to.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                              <td className="py-3.5 px-4 font-bold">ODS #{to.workOrderNumber}</td>
                              <td className="py-3.5 px-4">{to.cliente}</td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold rounded-md">
                                  {to.estado}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                ${to.servicesGenerated.toFixed(2)}
                              </td>
                              <td className="py-3.5 px-4 text-right text-gray-500 font-semibold">
                                ${to.partsGenerated.toFixed(2)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                                ${to.moneyGenerated.toFixed(2)}
                              </td>
                              <td className="py-3.5 px-4 text-center text-gray-400">{new Date(to.fechaIngreso).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      /* ─── Resumen (Todos los Técnicos) ─── */
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold">
                            <th className="py-3 px-4">Código ID</th>
                            <th className="py-3 px-4">Técnico Responsable</th>
                            <th className="py-3 px-4 text-center">Órdenes Completadas</th>
                            <th className="py-3 px-4 text-right">Servicios (Mano de Obra)</th>
                            <th className="py-3 px-4 text-right">Repuestos (Componentes)</th>
                            <th className="py-3 px-4 text-right">Total Facturado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
                          {paginatedTechs.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                              <td className="py-3.5 px-4 font-mono text-gray-500 font-semibold">TEC-{t.id}</td>
                              <td className="py-3.5 px-4 font-bold text-gray-800 dark:text-gray-200">{t.nombreCompleto}</td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => setSelectedTechId(String(t.id))}
                                  className="px-3 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white transition-all font-bold rounded-lg text-[10px]"
                                >
                                  🔍 {t.totalAssigned} órdenes (Ver trabajos)
                                </button>
                              </td>
                              <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                                ${t.servicesGenerated.toFixed(2)}
                              </td>
                              <td className="py-3.5 px-4 text-right text-gray-500 font-semibold">
                                ${t.partsGenerated.toFixed(2)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-extrabold text-gray-900 dark:text-white text-sm">
                                ${t.moneyGenerated.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}

                {/* 💻 Equipos Table */}
                {activeTab === 'equip' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold">
                        <th className="py-3 px-4">Marca de Equipo</th>
                        <th className="py-3 px-4 text-center">Volumen de Ingresos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
                      {paginatedEquip.map((eq, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                          <td className="py-3.5 px-4 font-bold">{eq.brand}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-extrabold rounded-lg">
                              {eq.count} equipos
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* ─── Premium Pagination Controls ─── */}
                {totalItems > 0 && (
                  <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 border-t border-gray-100 dark:border-gray-850 pt-6">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                      Mostrando del {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} al {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} registros
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Por Página Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium">Por página:</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl focus:outline-none font-semibold text-gray-700 dark:text-gray-300"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      {/* Navigation Pages Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200/50 dark:border-gray-800"
                        >
                          Anterior
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                          .map((p, idx, arr) => {
                            const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                            return (
                              <React.Fragment key={p}>
                                {showEllipsis && <span className="px-1 text-gray-400 text-xs">...</span>}
                                <button
                                  onClick={() => setCurrentPage(p)}
                                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    currentPage === p
                                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200/50 dark:border-gray-800'
                                  }`}
                                >
                                  {p}
                                </button>
                              </React.Fragment>
                            );
                          })}

                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200/50 dark:border-gray-800"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
