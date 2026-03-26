"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAds, createAd, updateAd, deleteAd } from "@/services/ad.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { AdFormValues } from "@/schemas/ad.schema"

export function useAds() {
  return useQuery({
    queryKey: QUERY_KEYS.ADS,
    queryFn: getAds,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ADS }),
  })
}
