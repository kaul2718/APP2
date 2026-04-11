'use client';

import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { apiRequest } from '@/lib/api';
import type { PaginatedResponse } from '@/types/pagination.types';

interface CrudMessages {
  created?: string;
  updated?: string;
  deleted?: string;
  restored?: string;
  toggled?: (enabled: boolean) => string;
  loadError?: string;
  createError?: string;
  updateError?: string;
  deleteError?: string;
  restoreError?: string;
  toggleError?: string;
}

export interface UseCrudOptions {
  listPath?: string;
  defaultLimit?: number;
  messages?: CrudMessages;
}

export interface UseCrudResult<T, TCreate, TUpdate> {
  items: T[];
  loading: boolean;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  searchTerm: string;
  showInactive: boolean;
  fetchItems: (
    page?: number,
    limit?: number,
    search?: string,
    includeInactive?: boolean,
    extraFilters?: Record<string, string | number | boolean | undefined | null>,
    listPathOverride?: string,
  ) => Promise<void>;
  createItem: (data: TCreate) => Promise<T>;
  updateItem: (id: number, data: TUpdate) => Promise<T>;
  toggleItemStatus: (id: number) => Promise<T>;
  deleteItem: (id: number) => Promise<boolean>;
  restoreItem: (id: number) => Promise<boolean>;
  setItems: Dispatch<SetStateAction<T[]>>;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  setShowInactive: Dispatch<SetStateAction<boolean>>;
}

export function useCrud<T, TCreate, TUpdate>(
  endpoint: string,
  options: UseCrudOptions = {},
): UseCrudResult<T, TCreate, TUpdate> {
  const { data: session } = useSession();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const listPath = options.listPath ?? `${normalizedEndpoint}/all`;
  const defaultLimit = options.defaultLimit ?? 10;

  const fetchItems = useCallback(
    async (
      page: number = 1,
      limit: number = defaultLimit,
      search: string = '',
      includeInactive: boolean = false,
      extraFilters?: Record<string, string | number | boolean | undefined | null>,
      listPathOverride?: string,
    ) => {
      try {
        setLoading(true);

        if (!session?.accessToken) {
          throw new Error('Token de sesion no disponible');
        }

        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (search) {
          queryParams.set('search', search);
        }

        if (includeInactive) {
          queryParams.set('includeInactive', 'true');
        }

        if (extraFilters) {
          Object.entries(extraFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              queryParams.set(key, String(value));
            }
          });
        }

        const effectiveListPath = listPathOverride ?? listPath;

        const data = await apiRequest<PaginatedResponse<T>>(
          `${effectiveListPath}?${queryParams.toString()}`,
          {},
          session,
        );

        if (!Array.isArray(data.items)) {
          throw new Error('Formato de respuesta invalido');
        }

        setItems(data.items);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
        setCurrentPage(data.currentPage);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : (options.messages?.loadError ?? 'Error al cargar registros'),
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [defaultLimit, listPath, options.messages?.loadError, session],
  );

  const createItem = useCallback(
    async (data: TCreate) => {
      try {
        const created = await apiRequest<T>(
          normalizedEndpoint,
          {
            method: 'POST',
            body: JSON.stringify(data),
          },
          session,
        );

        toast.success(options.messages?.created ?? 'Registro creado exitosamente');
        return created;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : (options.messages?.createError ?? 'Error al crear registro'),
        );
        throw error;
      }
    },
    [normalizedEndpoint, options.messages?.created, options.messages?.createError, session],
  );

  const updateItem = useCallback(
    async (id: number, data: TUpdate) => {
      try {
        const updated = await apiRequest<T>(
          `${normalizedEndpoint}/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(data),
          },
          session,
        );

        toast.success(options.messages?.updated ?? 'Registro actualizado exitosamente');
        return updated;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : (options.messages?.updateError ?? 'Error al actualizar registro'),
        );
        throw error;
      }
    },
    [normalizedEndpoint, options.messages?.updated, options.messages?.updateError, session],
  );

  const toggleItemStatus = useCallback(
    async (id: number) => {
      try {
        const updated = await apiRequest<T & { estado?: boolean }>(
          `${normalizedEndpoint}/${id}/toggle-estado`,
          {
            method: 'PATCH',
          },
          session,
        );

        if (options.messages?.toggled) {
          toast.success(options.messages.toggled(Boolean(updated.estado)));
        } else {
          toast.success('Estado actualizado exitosamente');
        }

        return updated as T;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : (options.messages?.toggleError ?? 'Error al cambiar estado'),
        );
        throw error;
      }
    },
    [normalizedEndpoint, options.messages?.toggleError, options.messages?.toggled, session],
  );

  const deleteItem = useCallback(
    async (id: number) => {
      try {
        await apiRequest<void>(
          `${normalizedEndpoint}/${id}`,
          {
            method: 'DELETE',
          },
          session,
        );

        toast.success(options.messages?.deleted ?? 'Registro eliminado exitosamente');
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : (options.messages?.deleteError ?? 'Error al eliminar registro'),
        );
        throw error;
      }
    },
    [normalizedEndpoint, options.messages?.deleteError, options.messages?.deleted, session],
  );

  const restoreItem = useCallback(
    async (id: number) => {
      try {
        await apiRequest<void>(
          `${normalizedEndpoint}/${id}/restore`,
          {
            method: 'PATCH',
          },
          session,
        );

        toast.success(options.messages?.restored ?? 'Registro restaurado exitosamente');
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : (options.messages?.restoreError ?? 'Error al restaurar registro'),
        );
        throw error;
      }
    },
    [normalizedEndpoint, options.messages?.restoreError, options.messages?.restored, session],
  );

  return {
    items,
    loading,
    totalPages,
    totalItems,
    currentPage,
    searchTerm,
    showInactive,
    fetchItems,
    createItem,
    updateItem,
    toggleItemStatus,
    deleteItem,
    restoreItem,
    setItems,
    setSearchTerm,
    setShowInactive,
  };
}
