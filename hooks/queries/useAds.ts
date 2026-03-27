"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAds, createAd, updateAd, deleteAd } from "@/services/ad.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { AdFormValues } from "@/schemas/ad.schema"

export function useAds() {
  return useQuery({
    queryKey: QUERY_KEYS.ADS,
    queryFn: getAds,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateAd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: AdFormValues) => createAd(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ADS }),
  })
}

export function useUpdateAd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AdFormValues }) => updateAd(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ADS }),
  })
}

export function useDeleteAd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAd(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.ADS })
      const prev = qc.getQueryData(QUERY_KEYS.ADS)
      qc.setQueryData(QUERY_KEYS.ADS, (old: any[] = []) => old.filter((a) => a.id !== id))
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.ADS, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ADS }),
  })
}
