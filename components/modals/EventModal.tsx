"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CroppableFileUploadField } from "@/components/forms/CroppableFileUploadField"
import { eventSchema, type EventFormValues } from "@/schemas/event.schema"
import { useCreateEvent, useUpdateEvent, useEventCategories } from "@/hooks/queries/useEvents"
import { countries } from "@/lib/countries"
import type { Event } from "@/types"

interface EventModalProps {
  open: boolean
  onClose: () => void
  event?: Event | null
  onSuccess?: () => void
}

export function EventModal({ open, onClose, event, onSuccess }: EventModalProps) {
  const isEdit = !!event
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const { data: categories = [] } = useEventCategories()
  const isPending = createEvent.isPending || updateEvent.isPending
  const [imageUploading, setImageUploading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      image_path: "",
      event_date: "",
      start_date: "",
      end_date: "",
      category_id: "",
      country: "",
      address: "",
      website: "",
    },
  })

  useEffect(() => {
    if (!open) {
      setImageUploading(false)
      return
    }
    if (event) {
      reset({
        title: event.title,
        description: event.description ?? "",
        image_path: event.image_path ?? "",
        event_date: event.event_date ? event.event_date.slice(0, 10) : "",
        start_date: event.start_date ? event.start_date.slice(0, 10) : "",
        end_date: event.end_date ? event.end_date.slice(0, 10) : "",
        category_id: event.category_id ?? "",
        country: event.country ?? "",
        address: event.address ?? "",
        website: event.website ?? "",
      })
    } else {
      reset({
        title: "",
        description: "",
        image_path: "",
        event_date: "",
        start_date: "",
        end_date: "",
        category_id: "",
        country: "",
        address: "",
        website: "",
      })
    }
  }, [open, event, reset])

  async function onSubmit(values: EventFormValues) {
    try {
      if (isEdit) {
        await updateEvent.mutateAsync({ id: event!.id, values })
      } else {
        await createEvent.mutateAsync(values)
      }
      onSuccess?.()
      onClose()
    } catch {
      // error shown via mutationError
    }
  }

  const mutationError = createEvent.error ?? updateEvent.error

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Event" : "Create Event"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Title *</label>
          <Input {...register("title")} placeholder="Event title" />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Description</label>
          <Textarea {...register("description")} placeholder="Event description…" rows={3} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Image *</label>
          <CroppableFileUploadField
            folder="events/images"
            aspect={16 / 9}
            label="Click to upload event image"
            existingValue={isEdit ? (event?.image_path ?? null) : null}
            onUploadSuccess={({ key }) => setValue("image_path", key, { shouldValidate: true })}
            onUploadingChange={setImageUploading}
          />
          {errors.image_path && (
            <p className="text-xs text-red-500">{errors.image_path.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Start Date</label>
            <Input {...register("start_date")} type="date" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">End Date</label>
            <Input {...register("end_date")} type="date" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Date (Legacy)</label>
            <Input {...register("event_date")} type="date" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Category</label>
            <Select {...register("category_id")}>
              <option value="">— No category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Country</label>
          <Select {...register("country")}>
            <option value="">— Select country —</option>
            {countries
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Address</label>
          <Input {...register("address")} placeholder="Full address" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Website</label>
          <Input {...register("website")} placeholder="https://example.com" />
        </div>

        {mutationError && (
          <p className="text-sm text-red-500">
            {mutationError instanceof Error ? mutationError.message : "Something went wrong"}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending || imageUploading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || imageUploading}>
            {imageUploading ? "Uploading…" : isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Event"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
