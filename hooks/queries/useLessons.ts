"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  type LessonInput,
} from "@/services/courseLesson.service"
import { QUERY_KEYS } from "@/lib/queryKeys"

function lessonKeys(courseId: string) {
  return [...QUERY_KEYS.COURSE_LESSONS, courseId]
}

export function useLessons(courseId: string) {
  return useQuery({
    queryKey: lessonKeys(courseId),
    queryFn: () => getLessons(courseId),
    enabled: !!courseId,
    staleTime: 30 * 1000,
  })
}

export function useCreateLesson(courseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LessonInput) => createLesson(courseId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: lessonKeys(courseId) }),
  })
}

export function useUpdateLesson(courseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LessonInput }) =>
      updateLesson(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: lessonKeys(courseId) }),
  })
}

export function useDeleteLesson(courseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLesson(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: lessonKeys(courseId) }),
  })
}
