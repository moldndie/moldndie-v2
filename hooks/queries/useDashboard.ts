"use client"

import { useQuery } from "@tanstack/react-query"
import { getDashboardStats } from "@/services/dashboard.service"
import { QUERY_KEYS } from "@/lib/queryKeys"

export function useDashboardStats() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD,
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
