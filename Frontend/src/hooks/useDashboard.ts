"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { apiRequest } from "@/lib/api";
import type { DashboardResponse } from "@/types/dashboard.types";

export function useDashboard(initialRange = "30d") {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<string>(initialRange);

  const fetchDashboard = useCallback(
    async (nextRange: string = range) => {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await apiRequest<DashboardResponse>(
          `/dashboard/me?range=${encodeURIComponent(nextRange)}`,
          {},
          session,
        );

        setData(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al cargar dashboard";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [range, session],
  );

  useEffect(() => {
    if (status === "authenticated") {
      void fetchDashboard(range);
    }

    if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, range, fetchDashboard]);

  const changeRange = async (nextRange: string) => {
    setRange(nextRange);
    await fetchDashboard(nextRange);
  };

  return {
    data,
    loading,
    error,
    range,
    setRange: changeRange,
    refetch: fetchDashboard,
  };
}
