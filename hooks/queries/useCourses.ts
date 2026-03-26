"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "@/services/course.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { CourseFormValues } from "@/schemas/course.schema"

export function useCourses() {
  return useQuery({
    queryKey: QUERY_KEYS.COURSES,
    queryFn: getCourses,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.COURSES }),
  })
}
