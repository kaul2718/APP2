'use client';

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { 
  PlusCircleIcon, 
  UsersIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  BriefcaseIcon,
  UserIcon as UserIconOutline
} from "@heroicons/react/24/outline";
import UsuarioNuevoTable from "@/components/tables/usuarioNuevoTable";
import UsuarioCreateModal from "@/components/modals/UsuarioCreateModal";
import { useUsuario } from "@/hooks/useUsuario";

const ROLES = [
  { id: 'all', nombre: 'Todos', icon: <UsersIcon className="w-4 h-4" /> },
  { id: 'admin', nombre: 'Admins', icon: <ShieldCheckIcon className="w-4 h-4" /> },
  { id: 'tech', nombre: 'Técnicos', icon: <BriefcaseIcon className="w-4 h-4" /> },
  { id: 'recep', nombre: 'Recepción', icon: <UserGroupIcon className="w-4 h-4" /> },
  { id: 'client', nombre: 'Clientes', icon: <UserIconOutline className="w-4 h-4" /> },
];

export default function ClientComponent() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const usuarioHook = useUsuario();
    const { 
        usuarios, 
        totalItems, 
        roleFilter, 
        setRoleFilter, 
        showInactive 
    } = usuarioHook;

    // Stats calculations
    const stats = useMemo(() => {
        const admins = usuarios.filter(u => u.role === 'admin').length;
        const techs = usuarios.filter(u => u.role === 'tech').length;
        return { admins, techs };
    }, [usuarios]);

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Gestión de Usuarios" />

            {/* Quick Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard 
                    icon={<UsersIcon className="w-6 h-6 text-brand-500" />} 
                    label="Total Usuarios" 
                    value={totalItems} 
                    delay={0.1}
                />
                <StatCard 
                    icon={<ShieldCheckIcon className="w-6 h-6 text-amber-500" />} 
                    label="Administradores" 
                    value={stats.admins} 
                    delay={0.2}
                />
                <StatCard 
                    icon={<UserGroupIcon className="w-6 h-6 text-blue-500" />} 
                    label="Técnicos" 
                    value={stats.techs} 
                    delay={0.3}
                />
            </div>

            {/* Main Section Header with Filters & Action */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
                    {ROLES.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setRoleFilter(role.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                                roleFilter === role.id
                                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 scale-105'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {role.icon}
                            <span>{role.nombre}</span>
                        </button>
                    ))}
                </div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-shrink-0"
                >
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full xl:w-auto flex items-center justify-center gap-2 px-6 shadow-lg shadow-brand-500/20"
                        size="md"
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>Nuevo Usuario</span>
                    </Button>
                </motion.div>
            </div>

            {/* Main Table Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-500/10 rounded-lg">
                            <UsersIcon className="w-5 h-5 text-brand-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lista de Personal</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Filtrando por: <span className="font-bold text-brand-500 capitalize">{ROLES.find(r => r.id === roleFilter)?.nombre}</span></p>
                        </div>
                    </div>
                </div>

                <div className="p-0">
                    <UsuarioNuevoTable 
                        key={tableRefreshKey} 
                        usuarioHook={usuarioHook}
                    />
                </div>
            </motion.div>

            <UsuarioCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={() => setTableRefreshKey((prev) => prev + 1)}
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
            className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow"
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