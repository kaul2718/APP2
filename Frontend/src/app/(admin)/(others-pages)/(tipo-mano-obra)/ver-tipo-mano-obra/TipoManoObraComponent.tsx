'use client';
 
import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { 
  PlusCircleIcon, 
  WrenchScrewdriverIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  BriefcaseIcon,
  ArchiveBoxIcon
} from "@heroicons/react/24/outline";
import TipoManoObraTable from "@/components/tables/tipoManoObraTable";
import AgregarTipoManoObraModal from "@/components/modals/AgregarTipoManoObraModal";
import { useTipoManoObra, TipoManoObra } from "@/hooks/useTipoManoObra";
import { apiRequest } from "@/lib/api";

export default function TipoManoObraComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const hook = useTipoManoObra();
    const { fetchTipos } = hook;
    const [allTiposForStats, setAllTiposForStats] = useState<TipoManoObra[]>([]);

    // Fetch all for stats
    const { data: session } = useSession();
    useEffect(() => {
        const loadAllForStats = async () => {
            if (!session?.accessToken) return;
            try {
                const data = await apiRequest<any>('/tipos-mano-obra/all?limit=1000&page=1&includeInactive=true', {}, session);
                if (data && Array.isArray(data.items)) {
                    setAllTiposForStats(data.items);
                }
            } catch (error) {
                console.error("Error loading stats:", error);
            }
        };
        loadAllForStats();
    }, [session, tableRefreshKey]);

    // Stats calculations
    const stats = useMemo(() => {
        const total = allTiposForStats.length;
        const active = allTiposForStats.filter(t => t.estado).length;
        const inactive = allTiposForStats.filter(t => !t.estado).length;
        return { total, active, inactive };
    }, [allTiposForStats]);

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Gestión de Tipos de Mano de Obra" />

            {/* Quick Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard 
                    icon={<BriefcaseIcon className="w-6 h-6 text-brand-500" />} 
                    label="Total Servicios" 
                    value={stats.total} 
                    delay={0.1}
                />
                <StatCard 
                    icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />} 
                    label="Servicios Activos" 
                    value={stats.active} 
                    delay={0.2}
                />
                <StatCard 
                    icon={<NoSymbolIcon className="w-6 h-6 text-red-500" />} 
                    label="Servicios Inactivos" 
                    value={stats.inactive} 
                    delay={0.3}
                />
            </div>

            {/* Main Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/10 rounded-lg">
                        <WrenchScrewdriverIcon className="h-5 w-5 text-brand-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tipos de Mano de Obra</h2>
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
                        <span>Nuevo Tipo</span>
                    </Button>
                </motion.div>
            </div>

            {/* Main Table Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
            >
                <div className="p-0">
                    <TipoManoObraTable 
                        key={tableRefreshKey} 
                        tipoManoObraHook={hook}
                    />
                </div>
            </motion.div>

            <AgregarTipoManoObraModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setTableRefreshKey((prev) => prev + 1);
                    hook.fetchTipos();
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