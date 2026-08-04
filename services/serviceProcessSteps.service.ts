"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export interface ServiceProcessStep {
  id: string
  label: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface ServiceProcessStepFormValues {
  label: string
  description?: string
  sort_order: number
  is_active: boolean
}

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

function revalidate() {
  revalidatePath("/services", "layout")
  revalidatePath("/dashboard/services")
}

function toRow(values: ServiceProcessStepFormValues) {
  return {
    label:       values.label,
    description: values.description || null,
    sort_order:  values.sort_order,
    is_active:   values.is_active,
  }
}

export async function getProcessSteps(): Promise<ServiceProcessStep[]> {
  const { data, error } = await createAdminClient()
    .from("service_process_steps")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return (data ?? []) as ServiceProcessStep[]
}

export async function getActiveProcessSteps(): Promise<ServiceProcessStep[]> {
  const { data, error } = await createAdminClient()
    .from("service_process_steps")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return (data ?? []) as ServiceProcessStep[]
}

export async function createProcessStep(
  values: ServiceProcessStepFormValues,
): Promise<ServiceProcessStep> {
  const { data, error } = await createAdminClient()
    .from("service_process_steps")
    .insert(toRow(values))
    .select()
    .single()
  if (error) throw dbError(error)
  revalidate()
  return data as ServiceProcessStep
}

export async function updateProcessStep(
  id: string,
  values: ServiceProcessStepFormValues,
): Promise<ServiceProcessStep> {
  const { data, error } = await createAdminClient()
    .from("service_process_steps")
    .update(toRow(values))
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidate()
  return data as ServiceProcessStep
}

export async function deleteProcessStep(id: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("service_process_steps")
    .delete()
    .eq("id", id)
  if (error) throw dbError(error)
  revalidate()
}

export async function toggleProcessStepActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await createAdminClient()
    .from("service_process_steps")
    .update({ is_active })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidate()
}

export async function updateProcessStepOrder(id: string, sort_order: number): Promise<void> {
  const { error } = await createAdminClient()
    .from("service_process_steps")
    .update({ sort_order })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidate()
}
