"use client"

import { useQuery } from "@tanstack/react-query"
import { getContentViewCountsMap } from "@/services/contentViews.service"

export function useContentViewCounts(contentType: string, contentIds: string[]) {
  return useQuery({
    queryKey: ["content_views", contentType, contentIds],
    queryFn: () => getContentViewCountsMap(contentType, contentIds),
    staleTime: 60 * 1000,
    enabled: contentIds.length > 0,
  })
}
