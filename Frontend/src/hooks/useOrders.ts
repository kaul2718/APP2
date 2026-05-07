'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { apiRequest } from "@/lib/api";
import type { PaginatedResponse } from "@/types/pagination.types";
import type {
  EstadoOrdenBasic,
  EquipoBasic,
  Order,
  UserBasic,
} from "@/types/order.types";

type PaginatedOrderResponse = PaginatedResponse<Order>;
export type { UserBasic, EquipoBasic, EstadoOrdenBasic, Order };

export function useOrders() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [estadoOrdenId, setEstadoOrdenId] = useState<number | undefined>();
  const [technicianId, setTechnicianId] = useState<number | undefined>();
  const [clientId, setClientId] = useState<number | undefined>();
  const [fechaInicio, setFechaInicio] = useState<string | undefined>();
  const [fechaFin, setFechaFin] = useState<string | undefined>();

  const fetchOrders = async (
    page: number = 1,
    limit: number = 10,
    search: string = "",
    includeInactive: boolean = false,
    estadoId?: number,
    techId?: number,
    clientId?: number,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setLoading(true);

      if (!session?.accessToken || !session.user) {
        throw new Error("Sesión no disponible");
      }

      // Determinar el endpoint basado en el rol del usuario
      let endpoint = 'orders';
      let isRoleSpecificEndpoint = false;

      if (session.user.role === 'tech') {
        endpoint = 'tecnico/mis-ordenes';
        isRoleSpecificEndpoint = true;
      } else if (session.user.role === 'client') {
        endpoint = 'cliente/mis-ordenes';
        isRoleSpecificEndpoint = true;
      }

      let url = `/${endpoint}`;

      // Solo agregamos parámetros de consulta para el endpoint general
      if (!isRoleSpecificEndpoint) {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());

        if (search) {
          queryParams.append('search', search);
        }

        if (includeInactive) {
          queryParams.append('includeInactive', 'true');
        }

        if (estadoId) {
          queryParams.append('estadoOrdenId', estadoId.toString());
        }

        if (techId) {
          queryParams.append('technicianId', techId.toString());
        }

        if (clientId) {
          queryParams.append('clientId', clientId.toString());
        }

        if (startDate && endDate) {
          queryParams.append('fechaInicio', startDate);
          queryParams.append('fechaFin', endDate);
        }

        url += `?${queryParams.toString()}`;
      }

      // Manejar diferentes formatos de respuesta
      let responseData: PaginatedOrderResponse;

      if (isRoleSpecificEndpoint) {
        // Los endpoints específicos devuelven un array directo
        const items = await apiRequest<Order[]>(url, {}, session);
        responseData = {
          items,
          totalItems: items.length,
          totalPages: 1,
          currentPage: 1
        };
      } else {
        // El endpoint general devuelve la estructura paginada
        responseData = await apiRequest<PaginatedOrderResponse>(url, {}, session);
      }

      // Verificar que los datos sean válidos
      if (!responseData.items || !Array.isArray(responseData.items)) {
        throw new Error("Formato de respuesta inválido");
      }

      // Actualizar los estados con los datos recibidos
      setOrders(responseData.items);
      setTotalPages(responseData.totalPages);
      setTotalItems(responseData.totalItems);
      setCurrentPage(responseData.currentPage);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar órdenes");
      setOrders([]);
      setTotalPages(1);
      setTotalItems(0);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: {
    clientId: number;
    equipoId: number;
    problemaReportado: string;
    accesorios?: string[];
    fechaPrometidaEntrega?: string;
    technicianId?: number;
    estadoOrdenId?: number;
  }) => {
    try {
      // Validación adicional
      if (!orderData.clientId || !orderData.equipoId) {
        throw new Error("Debe seleccionar un cliente y un equipo");
      }

      const payload = {
        ...orderData,
        accesorios: orderData.accesorios || [],
        fechaPrometidaEntrega: orderData.fechaPrometidaEntrega || null,
        estadoOrdenId: orderData.estadoOrdenId || undefined, // El backend usará el estado por defecto
        recepcionistaId: session?.user?.id
      };

      //console.log('Enviando al backend:', payload);

      const data = await apiRequest<Order>(
        '/orders',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        session,
      );

      return data;
    } catch (error) {
      //console.error('Error en createOrder:', error);
      throw error;
    }
  };

  const updateOrder = async (id: number, orderData: {
    technicianId?: number | null;
    estadoOrdenId?: number | null;
    problemaReportado?: string;
    fechaPrometidaEntrega?: string | null;
    accesorios?: string[];
    casilleroId?: number | null;
    userId?: number;
  }) => {
    try {
      if (!session?.accessToken || !session.user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const payload = {
        ...orderData,
        userId: session.user.id, // 👈 lo agregas tú aquí
      };

      return await apiRequest<Order>(
        `/orders/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        },
        session,
      );
    } catch (error) {
      //console.error("Error updating order:", error);
      throw error;
    }
  };

  const toggleOrderStatus = async (id: number) => {
    try {
      const updatedOrder = await apiRequest<Order>(
        `/orders/${id}/toggle-estado`,
        {
          method: 'PATCH',
        },
        session,
      );
      toast.success(`Orden ${updatedOrder.estado ? 'activada' : 'desactivada'} exitosamente`);
      return updatedOrder;
    } catch (error) {
      //console.error("Error al cambiar estado de la orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado de la orden");
      throw error;
    }
  };

  const deleteOrder = async (id: number) => {
    try {
      await apiRequest<void>(
        `/orders/${id}`,
        {
          method: 'DELETE',
        },
        session,
      );

      toast.success("Orden eliminada exitosamente");
      return true;
    } catch (error) {
      //console.error("Error al eliminar orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar orden");
      throw error;
    }
  };

  const restoreOrder = async (id: number) => {
    try {
      await apiRequest<void>(
        `/orders/${id}/restore`,
        {
          method: 'PATCH',
        },
        session,
      );

      toast.success("Orden restaurada exitosamente");
      return true;
    } catch (error) {
      //console.error("Error al restaurar orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al restaurar orden");
      throw error;
    }
  };

  const changeOrderStatus = async (orderId: number, estadoOrdenId: number) => {
    try {
      if (!session?.user?.id) {
        throw new Error("Usuario no autenticado");
      }

      const updatedOrder = await apiRequest<Order>(
        `/orders/${orderId}/estado/${estadoOrdenId}`,
        {
          method: 'PATCH',
        },
        session,
      );
      toast.success("Estado de la orden actualizado exitosamente");
      return updatedOrder;
    } catch (error) {
      //console.error("Error al cambiar estado de la orden:", error);
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado de la orden");
      throw error;
    }
  };

  const addActivity = async (orderId: number, activityData: any) => {
    try {
      const newActivity = await apiRequest<any>(
        `/orders/${orderId}/actividades`,
        {
          method: 'POST',
          body: JSON.stringify(activityData),
        },
        session,
      );
      toast.success("Actividad técnica agregada exitosamente");
      return newActivity;
    } catch (error) {
      //console.error("Error al agregar actividad técnica:", error);
      toast.error(error instanceof Error ? error.message : "Error al agregar actividad técnica");
      throw error;
    }
  };

  // Efecto para cargar órdenes cuando cambian los filtros
  useEffect(() => {
    if (status === "authenticated") {
      fetchOrders(
        1,
        10,
        searchTerm,
        showInactive,
        estadoOrdenId,
        technicianId,
        clientId,
        fechaInicio,
        fechaFin
      );
    }
  }, [
    status,
    session,
    searchTerm,
    showInactive,
    estadoOrdenId,
    technicianId,
    clientId,
    fechaInicio,
    fechaFin
  ]);

  return {
    orders,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    estadoOrdenId,
    technicianId,
    clientId,
    fechaInicio,
    fechaFin,
    fetchOrders,
    createOrder,
    updateOrder,
    toggleOrderStatus,
    deleteOrder,
    restoreOrder,
    changeOrderStatus,
    addActivity,
    setSearchTerm,
    setShowInactive,
    setEstadoOrdenId,
    setTechnicianId,
    setClientId,
    setFechaInicio,
    setFechaFin,
  };
}