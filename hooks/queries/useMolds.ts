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
  type DifficultyFilter,
} from "@/services/mold.service"
import { getGalleryItems } from "@/services/moldGallery.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { MoldFormValues } from "@/schemas/mold.schema"

export type { MoldsParams, MoldsListingParams, PriceFilter, SortOption, DifficultyFilter }

export function useMoldById(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MOLDS, id],
    queryFn: () => getMoldById(id),
    staleTime: 60 * 1000,
    enabled: !!id,
  })
}

export function useMoldGallery(moldId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MOLDS, moldId, "gallery"],
    queryFn: () => getGalleryItems(moldId),
    staleTime: 60 * 1000,
    enabled: !!moldId,
  })
}

export function useMolds(params?: MoldsParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MOLDS, params ?? {}],
    queryFn: () => getMolds(params),
    staleTime: 5 * 60 * 1000,
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
      params.difficulty ?? "",
      params.page ?? 1,
      params.pageSize ?? 12,
    ],
    queryFn: () => getMoldsListing(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
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
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.MOLDS })
      const snapshots = qc.getQueriesData({ queryKey: QUERY_KEYS.MOLDS })
      qc.setQueriesData({ queryKey: QUERY_KEYS.MOLDS }, (old: any) =>
        Array.isArray(old) ? old.filter((m) => m.id !== id) : old
      )
      return { snapshots }
    },
    onError: (_, __, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.MOLDS }),
  })
}
