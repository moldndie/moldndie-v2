"use client"

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import {
  getCourses,
  getCourseById,
  getCoursesListing,
  createCourse,
  updateCourse,
  deleteCourse,
  type CoursesListingParams,
  type CourseSort,
} from "@/services/course.service"
import {
  getAcademyCategories,
  createAcademyCategory,
  updateAcademyCategory,
  deleteAcademyCategory,
  toggleAcademyCategoryActive,
  type AcademyCategoryPayload,
} from "@/services/academyCategory.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { CourseFormValues } from "@/schemas/course.schema"

async function fetchCourseAccess(id: string): Promise<boolean> {
  const res = await fetch(`/api/courses/${id}/access`)
  if (!res.ok) return false
  const json = await res.json()
  return json.purchased ?? false
}

export function useCourseById(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.COURSES, id],
    queryFn: () => getCourseById(id),
    staleTime: 60 * 1000,
    enabled: !!id,
  })
}

export function useCourseAccess(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.COURSES, id, "access"],
    queryFn: () => fetchCourseAccess(id),
    staleTime: 60 * 1000,
    enabled: !!id,
  })
}

export type { CoursesListingParams, CourseSort }

export function useCoursesListing(params: CoursesListingParams = {}) {
  return useQuery({
    queryKey: [
      "courses", "listing",
      params.search ?? "",
      params.sort ?? "newest",
      params.categoryId ?? null,
      params.traineeLevel ?? "",
      params.page ?? 1,
      params.pageSize ?? 12,
    ],
    queryFn: () => getCoursesListing(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useAcademyCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.ACADEMY_CATEGORIES,
    queryFn: getAcademyCategories,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCourses() {
  return useQuery({
    queryKey: QUERY_KEYS.COURSES,
    queryFn: getCourses,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: CourseFormValues) => createCourse(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.COURSES }),
  })
}

export function useUpdateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CourseFormValues }) =>
      updateCourse(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.COURSES }),
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.COURSES })
      const prev = qc.getQueryData(QUERY_KEYS.COURSES)
      qc.setQueryData(QUERY_KEYS.COURSES, (old: any[] = []) => old.filter((c) => c.id !== id))
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.COURSES, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.COURSES }),
  })
}

// Academy category mutations
export function useCreateAcademyCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AcademyCategoryPayload) => createAcademyCategory(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ACADEMY_CATEGORIES }),
  })
}

export function useUpdateAcademyCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AcademyCategoryPayload }) =>
      updateAcademyCategory(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ACADEMY_CATEGORIES }),
  })
}

export function useDeleteAcademyCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAcademyCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ACADEMY_CATEGORIES }),
  })
}

export function useToggleAcademyCategoryActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      toggleAcademyCategoryActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ACADEMY_CATEGORIES }),
  })
}
