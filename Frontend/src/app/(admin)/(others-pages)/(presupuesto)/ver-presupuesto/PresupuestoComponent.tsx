'use client';
 
import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { 
  PlusCircleIcon, 
  BanknotesIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  ArchiveBoxIcon,
  ClockIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import PresupuestoTable from "@/components/tables/presupuestoTable";
import AgregarPresupuestoModal from "@/components/modals/AgregarPresupuestoModal";
import { usePresupuesto, Presupuesto } from "@/hooks/usePresupuesto";
import { apiRequest } from "@/lib/api";

export default function PresupuestoComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const hook = usePresupuesto();
    const { fetchPresupuestos, searchTerm, showInactive } = hook;
    const [allPresupuestosForStats, setAllPresupuestosForStats] = useState<Presupuesto[]>([]);

    // Fetch all for stats
    const { data: session, status } = useSession();
    useEffect(() => {
        const loadAllForStats = async () => {
            if (!session?.accessToken) return;
            try {
                const data = await apiRequest<any>('/presupuestos/all?limit=1000&page=1&includeDeleted=true', {}, session);
                if (data && Array.isArray(data.items)) {
                    setAllPresupuestosForStats(data.items);
                }
            } catch (error) {
                console.error("Error loading stats:", error);
            }
        };
        loadAllForStats();
    }, [session, tableRefreshKey]);

    // Stats calculations
    const stats = useMemo(() => {
        const total = allPresupuestosForStats.length;
        const approved = allPresupuestosForStats.filter(p => p.estado?.nombre.toLowerCase() === 'aprobado').length;
        const pending = allPresupuestosForStats.filter(p => p.estado?.nombre.toLowerCase() === 'pendiente').length;
        const canceled = allPresupuestosForStats.filter(p => p.estado?.nombre.toLowerCase() === 'cancelado' || p.estado?.nombre.toLowerCase() === 'rechazado').length;
        return { total, approved, pending, canceled };
    }, [allPresupuestosForStats]);

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Gestión de Presupuestos" />

            {/* Quick Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    icon={<BanknotesIcon className="w-6 h-6 text-brand-500" />} 
                    label="Total Presupuestos" 
                    value={stats.total} 
                    delay={0.1}
                />
                <StatCard 
                    icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />} 
                    label="Aprobados" 
                    value={stats.approved} 
                    delay={0.2}
                />
                <StatCard 
                    icon={<ClockIcon className="w-6 h-6 text-amber-500" />} 
                    label="Pendientes" 
                    value={stats.pending} 
                    delay={0.3}
                />
                <StatCard 
                    icon={<NoSymbolIcon className="w-6 h-6 text-red-500" />} 
                    label="Rechazados/Canc." 
                    value={stats.canceled} 
                    delay={0.4}
                />
            </div>

            {/* Main Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/10 rounded-lg">
                        <CurrencyDollarIcon className="h-5 w-5 text-brand-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Control Presupuestario</h2>
                        <p className="text-xs text-gray-500 mt-1">Historial y estados de cotizaciones</p>
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
                        <span>Nuevo Presupuesto</span>
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
                    <PresupuestoTable 
                        key={tableRefreshKey} 
                        presupuestoHook={hook}
                    />
                </div>
            </motion.div>

            <AgregarPresupuestoModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setTableRefreshKey((prev) => prev + 1);
                    hook.fetchPresupuestos();
                }}
            />
        </div>
    );
}

function StatCard({ icon, label, value, delay }: { icon: React.ReactNode, label: string, value: number, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow"
        >
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
            </div>
        </motion.div>
    );
}