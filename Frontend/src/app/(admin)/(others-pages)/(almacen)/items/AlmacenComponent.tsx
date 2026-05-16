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
  TruckIcon
} from "@heroicons/react/24/outline";
import AlmacenTable from "@/components/tables/almacenTable";
import AgregarAlmacenModal from "@/components/modals/AgregarAlmacenModal";
import { useAlmacen, ItemAlmacen } from "@/hooks/useAlmacen";
import { apiRequest } from "@/lib/api";

export default function AlmacenComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const hook = useAlmacen();
    const [allItemsForStats, setAllItemsForStats] = useState<ItemAlmacen[]>([]);

    // Fetch all for stats
    const { data: session } = useSession();
    useEffect(() => {
        const loadAllForStats = async () => {
            if (!session?.accessToken) return;
            try {
                const data = await apiRequest<any>('/partes/all?limit=1000&page=1&includeInactive=true', {}, session);
                if (data && Array.isArray(data.items)) {
                    setAllItemsForStats(data.items);
                }
            } catch (error) {
                console.error("Error loading stats:", error);
            }
        };
        loadAllForStats();
    }, [session, tableRefreshKey]);

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
                    icon={<ArchiveBoxIcon className="w-6 h-6 text-brand-500" />} 
                    label="Items en Catálogo" 
                    value={stats.totalItems} 
                    delay={0.1}
                />
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
                <StatCard 
                    icon={<CurrencyDollarIcon className="w-6 h-6 text-green-500" />} 
                    label="Valor del Inventario" 
                    value={formatCurrency(stats.totalStockValue)} 
                    delay={0.4}
                />
            </div>

            {/* Main Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/10 rounded-lg">
                        <ShoppingBagIcon className="h-5 w-5 text-brand-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Inventario Unificado</h2>
                        <p className="text-xs text-gray-500">Control de precios, costos y existencias reales</p>
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
                        <span>Nuevo Producto</span>
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
                        onDataChange={() => setTableRefreshKey(prev => prev + 1)}
                    />
                </div>
            </motion.div>

            <AgregarAlmacenModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setTableRefreshKey((prev) => prev + 1);
                    hook.fetchItems(1, 10);
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