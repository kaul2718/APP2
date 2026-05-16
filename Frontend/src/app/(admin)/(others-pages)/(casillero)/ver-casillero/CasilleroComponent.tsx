'use client';
 
import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { 
  PlusCircleIcon, 
  InboxIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  ArchiveBoxIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import CasilleroTable from "@/components/tables/casilleroTable";
import AgregarCasilleroModal from "@/components/modals/AgregarCasilleroModal";
import { useCasillero, Casillero } from "@/hooks/useCasillero";
import { apiRequest } from "@/lib/api";

export default function CasilleroComponent() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const casilleroHook = useCasillero();
    const { 
        fetchCasilleros, 
        searchTerm,
        showInactive
    } = casilleroHook;
    const [allCasillerosForStats, setAllCasillerosForStats] = useState<Casillero[]>([]);

    const { data: session, status } = useSession();

    // Fetch all for stats
    useEffect(() => {
        const loadAllForStats = async () => {
            if (!session?.accessToken) return;
            try {
                const data = await apiRequest<any>('/casilleros/all?limit=1000&page=1&includeInactive=true', {}, session);
                if (data && Array.isArray(data.items)) {
                    setAllCasillerosForStats(data.items);
                }
            } catch (error) {
                console.error("Error loading stats:", error);
            }
        };
        loadAllForStats();
    }, [session, tableRefreshKey]);

    // Initial fetch and synchronization with searchTerm/showInactive
    useEffect(() => {
        if (status === "authenticated") {
            fetchCasilleros(1, 10, searchTerm, showInactive);
        }
    }, [status, searchTerm, showInactive]);

    // Stats calculations
    const stats = useMemo(() => {
        const total = allCasillerosForStats.length;
        const available = allCasillerosForStats.filter(c => c.situacion === 'Disponible' && c.estado).length;
        const occupied = allCasillerosForStats.filter(c => c.situacion === 'Ocupado' && c.estado).length;
        const inactive = allCasillerosForStats.filter(c => !c.estado).length;
        return { total, available, occupied, inactive };
    }, [allCasillerosForStats]);

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Gestión de Casilleros" />

            {/* Quick Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    icon={<InboxIcon className="w-6 h-6 text-brand-500" />} 
                    label="Total Casilleros" 
                    value={stats.total} 
                    delay={0.1}
                />
                <StatCard 
                    icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />} 
                    label="Disponibles" 
                    value={stats.available} 
                    delay={0.2}
                />
                <StatCard 
                    icon={<LockClosedIcon className="w-6 h-6 text-amber-500" />} 
                    label="Ocupados" 
                    value={stats.occupied} 
                    delay={0.3}
                />
                <StatCard 
                    icon={<NoSymbolIcon className="w-6 h-6 text-red-500" />} 
                    label="Inactivos" 
                    value={stats.inactive} 
                    delay={0.4}
                />
            </div>

            {/* Main Section Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/10 rounded-lg">
                        <ArchiveBoxIcon className="h-5 w-5 text-brand-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Inventario de Casilleros</h2>
                        <p className="text-xs text-gray-500 mt-1">Administra la asignación y disponibilidad</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full sm:w-auto"
                    >
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 shadow-lg shadow-brand-500/20"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            <span>Nuevo Casillero</span>
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Main Table Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
            >
                <div className="p-0">
                    <CasilleroTable 
                        key={tableRefreshKey} 
                        casilleroHook={casilleroHook}
                    />
                </div>
            </motion.div>

            <AgregarCasilleroModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setTableRefreshKey((prev) => prev + 1);
                    casilleroHook.fetchCasilleros();
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