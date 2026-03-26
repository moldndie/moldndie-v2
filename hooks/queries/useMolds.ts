"use client"

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import {
  getMolds,
  getMoldById,
  getMoldCategories,
  getMoldsListing,
  createMold,
  updateMold,
  deleteMold,
  type MoldsParams,
  type MoldsListingParams,
  type PriceFilter,
  type SortOption,
} from "@/services/mold.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { MoldFormValues } from "@/schemas/mold.schema"

export type { MoldsParams, MoldsListingParams, PriceFilter, SortOption }

export function useMoldById(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MOLDS, id],
    queryFn: () => getMoldById(id),
    staleTime: 60 * 1000,
    enabled: !!id,
  })
}

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

export function useMoldsListing(params: MoldsListingParams = {}) {
  return useQuery({
    queryKey: [
      "molds", "listing",
      params.search ?? "",
      params.categoryId ?? null,
      params.priceFilter ?? "all",
      params.sort ?? "newest",
      params.page ?? 1,
    ],
    queryFn: () => getMoldsListing(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
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
