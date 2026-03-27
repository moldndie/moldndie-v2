"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FileUploadField } from "@/components/forms/FileUploadField"
import { supplierSchema, type SupplierFormValues } from "@/schemas/supplier.schema"
import { useCreateSupplier, useUpdateSupplier, useSupplierCategories } from "@/hooks/queries/useSuppliers"
import type { Supplier } from "@/types"

interface SupplierModalProps {
  open: boolean
  onClose: () => void
  supplier?: Supplier | null
  onSuccess?: () => void
}

export function SupplierModal({ open, onClose, supplier, onSuccess }: SupplierModalProps) {
  const isEdit = !!supplier
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const { data: categories = [] } = useSupplierCategories()
  const isPending = createSupplier.isPending || updateSupplier.isPending
  const [logoUploading, setLogoUploading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      description: "",
      logo_path: "",
      website: "",
      category_id: "",
      country: "",
      address: "",
    },
  })

  useEffect(() => {
    if (!open) {
      setLogoUploading(false)
      return
    }
    if (supplier) {
      reset({
        name: supplier.name,
        description: supplier.description ?? "",
        logo_path: supplier.logo_path ?? "",
        website: supplier.website ?? "",
        category_id: supplier.category_id ?? "",
        country: supplier.country ?? "",
        address: supplier.address ?? "",
      })
    } else {
      reset({
        name: "",
        description: "",
        logo_path: "",
        website: "",
        category_id: "",
        country: "",
        address: "",
      })
    }
  }, [open, supplier, reset])

  async function onSubmit(values: SupplierFormValues) {
    try {
      if (isEdit) {
        await updateSupplier.mutateAsync({ id: supplier!.id, values })
      } else {
        await createSupplier.mutateAsync(values)
      }
      onSuccess?.()
      onClose()
    } catch {
      // error shown via mutationError
    }
  }

  const mutationError = createSupplier.error ?? updateSupplier.error

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Supplier" : "Create Supplier"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Name *</label>
          <Input {...register("name")} placeholder="Supplier name" />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Description</label>
          <Textarea {...register("description")} placeholder="Supplier description…" rows={3} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Logo</label>
          <FileUploadField
            folder="suppliers/logos"
            accept="image/*"
            label="Click to upload supplier logo"
            existingValue={isEdit ? (supplier?.logo_path ?? null) : null}
            onUploadSuccess={({ key }) => setValue("logo_path", key, { shouldValidate: true })}
            onUploadingChange={setLogoUploading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Website</label>
            <Input {...register("website")} placeholder="https://example.com" />
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
          <Input {...register("country")} placeholder="e.g. Egypt" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Address</label>
          <Input {...register("address")} placeholder="Full address" />
        </div>

        {mutationError && (
          <p className="text-sm text-red-500">
            {mutationError instanceof Error ? mutationError.message : "Something went wrong"}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending || logoUploading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || logoUploading}>
            {logoUploading ? "Uploading…" : isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Supplier"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
