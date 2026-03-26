"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/services/event.service"
import { getEventCategories } from "@/services/eventCategory.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { EventFormValues } from "@/schemas/event.schema"

export function useEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.EVENTS,
    queryFn: getEvents,
  })
}

export function useEventCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.EVENT_CATEGORIES,
    queryFn: getEventCategories,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: EventFormValues) => createEvent(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS }),
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: EventFormValues }) =>
      updateEvent(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS }),
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS }),
  })
}
