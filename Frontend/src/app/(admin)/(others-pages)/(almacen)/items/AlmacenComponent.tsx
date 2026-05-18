'use client';
 
import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { 
  PlusCircleIcon, 
  ArchiveBoxIcon, 
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  TruckIcon,
  CogIcon
} from "@heroicons/react/24/outline";
import AlmacenTable from "@/components/tables/almacenTable";
import AgregarAlmacenModal from "@/components/modals/AgregarAlmacenModal";
import { useAlmacen, ItemAlmacen } from "@/hooks/useAlmacen";
import { apiRequest } from "@/lib/api";

export default function AlmacenComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const [activeFilter, setActiveFilter] = useState<"all" | "productos" | "servicios">("productos");
    const hook = useAlmacen(false);
    const [allItemsForStats, setAllItemsForStats] = useState<ItemAlmacen[]>([]);

    // Fetch for the main table data
    useEffect(() => {
        const filters: any = {};
        if (activeFilter === "servicios") filters.unidadMedida = "Servicio";
        if (activeFilter === "productos") filters.isNotServicio = "true";
        
        hook.fetchItems(1, 10, hook.searchTerm, hook.showInactive, filters);
    }, [activeFilter, tableRefreshKey]);

    // Fetch all for stats
    const { data: session } = useSession();
    useEffect(() => {
        const loadAllForStats = async () => {
            if (!session?.accessToken) return;
            try {
                let url = '/partes/all?limit=1000&page=1&includeInactive=true';
                if (activeFilter === "servicios") {
                    url += '&unidadMedida=Servicio';
                } else if (activeFilter === "productos") {
                    url += '&isNotServicio=true';
                }

                const data = await apiRequest<any>(url, {}, session);
                if (data && Array.isArray(data.items)) {
                    setAllItemsForStats(data.items);
                }
            } catch (error) {
                console.error("Error loading stats:", error);
            }
        };
        loadAllForStats();
    }, [session, tableRefreshKey, activeFilter]);

    // Handle filter changes
    useEffect(() => {
        if (session?.accessToken) {
            const extraFilters: any = {};
            if (activeFilter === "servicios") {
                extraFilters.unidadMedida = "Servicio";
            } else if (activeFilter === "productos") {
                extraFilters.isNotServicio = "true"; // Backend should handle this or similar
            }
            hook.fetchItems(1, 10, hook.searchTerm, hook.showInactive, extraFilters);
        }
    }, [activeFilter, session]);

    // Stats calculations
    const stats = useMemo(() => {
        const totalItems = allItemsForStats.length;
        const totalStockValue = allItemsForStats.reduce((acc, item) => acc + (Number(item.stock) * Number(item.costo)), 0);
        const lowStockItems = allItemsForStats.filter(item => Number(item.stock) <= Number(item.stockMinimo)).length;
        const totalPhysicalStock = allItemsForStats.reduce((acc, item) => acc + Number(item.stock), 0);
        
        return { totalItems, totalStockValue, lowStockItems, totalPhysicalStock };
    }, [allItemsForStats]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("es-EC", {
            style: "currency",
            currency: "USD",
        }).format(value);

    const formatStock = (value: number) => {
        // If it's an integer, show it without decimals. 
        // If it has decimals, show up to 3 (for fractional items like kilos/liters)
        return value % 1 === 0 ? value.toString() : value.toLocaleString("es-EC", { maximumFractionDigits: 3 });
    };

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Gestión de Almacén e Inventario" />

            {/* Quick Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    icon={activeFilter === "servicios" ? <CogIcon className="w-6 h-6 text-brand-500" /> : <ArchiveBoxIcon className="w-6 h-6 text-brand-500" />} 
                    label={activeFilter === "all" ? "Items en Catálogo" : activeFilter === "servicios" ? "Servicios Registrados" : "Productos en Catálogo"} 
                    value={stats.totalItems} 
                    delay={0.1}
                />
                
                {activeFilter !== "servicios" ? (
                    <>
                        <StatCard 
                            icon={<TruckIcon className="w-6 h-6 text-blue-500" />} 
                            label="Stock Físico Total" 
                            value={formatStock(stats.totalPhysicalStock)} 
                            delay={0.2}
                        />
                        <StatCard 
                            icon={<ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />} 
                            label="Items Stock Bajo" 
                            value={stats.lowStockItems} 
                            colorClass="text-amber-600"
                            delay={0.3}
                        />
                    </>
                ) : (
                    <div className="hidden lg:block lg:col-span-2"></div>
                )}

                <StatCard 
                    icon={<CurrencyDollarIcon className="w-6 h-6 text-green-500" />} 
                    label={activeFilter === "servicios" ? "Valor de Servicios" : "Valor del Inventario"} 
                    value={formatCurrency(stats.totalStockValue)} 
                    delay={0.4}
                />
            </div>

            {/* Main Section Header with Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-500/10 rounded-lg">
                            <ShoppingBagIcon className="h-5 w-5 text-brand-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Inventario Unificado</h2>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Productos y Servicios</p>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                        {[
                            { id: "all", label: "Todos", icon: null },
                            { id: "productos", label: "Productos", icon: <ArchiveBoxIcon className="w-4 h-4" /> },
                            { id: "servicios", label: "Servicios", icon: <CogIcon className="w-4 h-4" /> }
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id as any)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeFilter === filter.id
                                    ? "bg-white dark:bg-gray-700 text-brand-600 dark:text-white shadow-sm"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                            >
                                {filter.icon}
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 shadow-lg shadow-brand-500/20"
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>Nuevo Item</span>
                    </Button>
                </motion.div>
            </div>

            {/* Main Table Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
            >
                <div className="p-0">
                    <AlmacenTable 
                        key={tableRefreshKey} 
                        almacenHook={hook}
                        extraFilters={
                            activeFilter === "servicios" 
                            ? { unidadMedida: "Servicio" } 
                            : activeFilter === "productos" 
                            ? { isNotServicio: "true" } 
                            : {}
                        }
                        onDataChange={() => setTableRefreshKey(prev => prev + 1)}
                    />
                </div>
            </motion.div>

            <AgregarAlmacenModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setTableRefreshKey((prev) => prev + 1);
                }}
            />
        </div>
    );
}

function StatCard({ icon, label, value, delay, colorClass = "text-gray-900 dark:text-white" }: { icon: React.ReactNode, label: string, value: string | number, delay: number, colorClass?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow"
        >
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <h3 className={`text-xl font-bold ${colorClass}`}>{value}</h3>
            </div>
        </motion.div>
    );
}