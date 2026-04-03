"use client"

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import {
  getEvents,
  getEventsListing,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  type EventsListingParams,
  type EventSort,
} from "@/services/event.service"
import { getEventCategories } from "@/services/eventCategory.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { EventFormValues } from "@/schemas/event.schema"

export type { EventsListingParams, EventSort }

export function useEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.EVENTS,
    queryFn: getEvents,
    staleTime: 5 * 60 * 1000,
  })
}

export function useEventById(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.EVENTS, id],
    queryFn: () => getEventById(id),
    staleTime: 60 * 1000,
    enabled: !!id,
  })
}

export function useEventsListing(params: EventsListingParams = {}) {
  return useQuery({
    queryKey: [
      "events", "listing",
      params.search ?? "",
      params.categoryId ?? null,
      params.sort ?? "newest",
      params.page ?? 1,
      params.pageSize ?? 12,
    ],
    queryFn: () => getEventsListing(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
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
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.EVENTS })
      const prev = qc.getQueryData(QUERY_KEYS.EVENTS)
      qc.setQueryData(QUERY_KEYS.EVENTS, (old: any[] = []) => old.filter((e) => e.id !== id))
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.EVENTS, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.EVENTS }),
  })
}
