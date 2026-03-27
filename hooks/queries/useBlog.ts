"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getBlogs, createBlog, updateBlog, deleteBlog } from "@/services/blog.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { BlogFormValues } from "@/schemas/blog.schema"

export function useBlogs() {
  return useQuery({
    queryKey: QUERY_KEYS.BLOGS,
    queryFn: getBlogs,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateBlog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: BlogFormValues) => createBlog(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.BLOGS }),
  })
}

export function useUpdateBlog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BlogFormValues }) =>
      updateBlog(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.BLOGS }),
  })
}

export function useDeleteBlog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.BLOGS })
      const prev = qc.getQueryData(QUERY_KEYS.BLOGS)
      qc.setQueryData(QUERY_KEYS.BLOGS, (old: any[] = []) => old.filter((b) => b.id !== id))
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.BLOGS, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.BLOGS }),
  })
}
