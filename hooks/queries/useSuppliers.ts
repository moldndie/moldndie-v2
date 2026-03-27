"use client"

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import {
  getSuppliers,
  getSuppliersListing,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type SuppliersListingParams,
} from "@/services/supplier.service"
import { getSupplierCategories } from "@/services/supplierCategory.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { SupplierFormValues } from "@/schemas/supplier.schema"

export type { SuppliersListingParams }

export function useSuppliers() {
  return useQuery({
    queryKey: QUERY_KEYS.SUPPLIERS,
    queryFn: getSuppliers,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSupplierById(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.SUPPLIERS, id],
    queryFn: () => getSupplierById(id),
    staleTime: 60 * 1000,
    enabled: !!id,
  })
}

export function useSuppliersListing(params: SuppliersListingParams = {}) {
  return useQuery({
    queryKey: [
      "suppliers", "listing",
      params.search ?? "",
      params.categoryId ?? null,
      params.page ?? 1,
    ],
    queryFn: () => getSuppliersListing(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}

export function useSupplierCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.SUPPLIER_CATEGORIES,
    queryFn: getSupplierCategories,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: SupplierFormValues) => createSupplier(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIERS }),
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplierFormValues }) =>
      updateSupplier(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIERS }),
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.SUPPLIERS })
      const prev = qc.getQueryData(QUERY_KEYS.SUPPLIERS)
      qc.setQueryData(QUERY_KEYS.SUPPLIERS, (old: any[] = []) => old.filter((s) => s.id !== id))
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.SUPPLIERS, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIERS }),
  })
}
