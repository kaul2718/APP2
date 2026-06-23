'use client';

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { 
  PlusCircleIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  NoSymbolIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import ChecklistTemplateTable from "@/components/tables/checklistTemplateTable";
import AgregarChecklistTemplateModal from "@/components/modals/AgregarChecklistTemplateModal";
import EditarChecklistTemplateModal from "@/components/modals/EditarChecklistTemplateModal";
import { ChecklistTemplate } from "@/types/checklist.types";
import { usePermissions } from "@/hooks/usePermissions";
import { apiRequest } from "@/lib/api";

export default function ChecklistComponent() {
    const { hasPermission, loading } = usePermissions();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const [allTemplatesForStats, setAllTemplatesForStats] = useState<ChecklistTemplate[]>([]);

    const { data: session } = useSession();

    // Fetch all for stats
    useEffect(() => {
        const loadAllForStats = async () => {
            if (!session?.accessToken) return;
            try {
                const data = await apiRequest<any>('/checklist-template/all?limit=1000&page=1&includeInactive=true', {}, session);
                if (data && Array.isArray(data.items)) {
                    setAllTemplatesForStats(data.items);
                }
            } catch (error) {
                console.error("Error loading checklist template stats:", error);
            }
        };
        loadAllForStats();
    }, [session, tableRefreshKey]);

    // Stats calculations
    const stats = useMemo(() => {
        const total = allTemplatesForStats.length;
        const active = allTemplatesForStats.filter(t => t.estado).length;
        const inactive = allTemplatesForStats.filter(t => !t.estado).length;
        return { total, active, inactive };
    }, [allTemplatesForStats]);

    const handleEdit = (template: ChecklistTemplate) => {
        setEditingTemplate(template);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (!hasPermission("checklists.view")) {
        return (
            <div className="p-10 text-center bg-white dark:bg-gray-900 rounded-lg border border-gray-150 dark:border-gray-800 shadow-theme-xs">
                <h2 className="text-lg font-bold text-red-500">Acceso Denegado</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    No tienes los permisos asignados por el administrador para ver el módulo de Plantillas de Checklists. Por favor, contacta al administrador del sistema.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Configuración de Checklists" />

            {/* Quick Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard 
                    icon={<Squares2X2Icon className="w-6 h-6 text-brand-500" />} 
                    label="Total Plantillas" 
                    value={stats.total} 
                    delay={0.1}
                />
                <StatCard 
                    icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />} 
                    label="Plantillas Activas" 
                    value={stats.active} 
                    delay={0.2}
                />
                <StatCard 
                    icon={<NoSymbolIcon className="w-6 h-6 text-red-500" />} 
                    label="Plantillas Inactivas" 
                    value={stats.inactive} 
                    delay={0.3}
                />
            </div>

            {/* Main Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/10 rounded-lg">
                        <DocumentTextIcon className="h-5 w-5 text-brand-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Plantillas de peritaje técnico</h2>
                </div>

                {hasPermission("checklists.manage") && (
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 shadow-lg shadow-brand-500/20"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            <span>Nueva Plantilla</span>
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Main Table Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
            >
                <div className="p-0">
                    <ChecklistTemplateTable 
                        key={tableRefreshKey} 
                        onEdit={handleEdit}
                    />
                </div>
            </motion.div>

            <AgregarChecklistTemplateModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setTableRefreshKey((prev) => prev + 1);
                }}
            />

            <EditarChecklistTemplateModal
                isOpen={!!editingTemplate}
                template={editingTemplate}
                onClose={() => setEditingTemplate(null)}
                onSuccess={() => {
                    setTableRefreshKey((prev) => prev + 1);
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
