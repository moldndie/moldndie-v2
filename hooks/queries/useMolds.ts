"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getMolds,
  getMoldCategories,
  createMold,
  updateMold,
  deleteMold,
  type MoldsParams,
} from "@/services/mold.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { MoldFormValues } from "@/schemas/mold.schema"

export type { MoldsParams }

export function useMolds(params?: MoldsParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MOLDS, params ?? {}],
    queryFn: () => getMolds(params),
  })
}

export function useMoldCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.MOLD_CATEGORIES,
    queryFn: getMoldCategories,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateMold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: MoldFormValues) => createMold(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.MOLDS }),
  })
}

export function useUpdateMold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MoldFormValues }) =>
      updateMold(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.MOLDS }),
  })
}

export function useDeleteMold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMold(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.MOLDS }),
  })
}
