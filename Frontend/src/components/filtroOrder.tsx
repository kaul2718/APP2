import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useOrders } from '@/hooks/useOrders';
import { User, EstadoOrden } from '@/interfaces/order';

interface FilterOptions {
  estados: EstadoOrden[];
  tecnicos: User[];
  clientes: User[];
}

export function OrderFilters({ 
  onFilterChange,
  filterOptions
}: {
  onFilterChange: (filters: any) => void;
  filterOptions: FilterOptions;
}) {
  const [filters, setFilters] = useState({
    estadoOrdenId: 'all',
    technicianId: 'all',
    clientId: 'all',
    fechaInicio: '',
    fechaFin: '',
    includeInactive: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      {/* Filtro por Estado */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select
          name="estadoOrdenId"
          value={filters.estadoOrdenId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todos los estados</option>
          {filterOptions.estados.map(estado => (
            <option key={estado.id} value={estado.id}>
              {estado.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro por Técnico */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Técnico</label>
        <select
          name="technicianId"
          value={filters.technicianId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todos los técnicos</option>
          {filterOptions.tecnicos.map(tecnico => (
            <option key={tecnico.id} value={tecnico.id}>
              {tecnico.nombre} {tecnico.apellido}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro por Cliente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <select
          name="clientId"
          value={filters.clientId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todos los clientes</option>
          {filterOptions.clientes.map(cliente => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre} {cliente.apellido}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro por Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rango de fechas</label>
        <div className="flex gap-2">
          <input
            type="date"
            name="fechaInicio"
            value={filters.fechaInicio}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="date"
            name="fechaFin"
            value={filters.fechaFin}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filtro por Inactivos */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="includeInactive"
          name="includeInactive"
          checked={filters.includeInactive}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="includeInactive" className="ml-2 block text-sm text-gray-700">
          Mostrar inactivos
        </label>
      </div>
    </div>
  );
}