"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/services/supplier.service"
import { getSupplierCategories } from "@/services/supplierCategory.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { SupplierFormValues } from "@/schemas/supplier.schema"

export function useSuppliers() {
  return useQuery({
    queryKey: QUERY_KEYS.SUPPLIERS,
    queryFn: getSuppliers,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIERS }),
  })
}
