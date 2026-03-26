"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, UserX, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "./DataTable"
import { UserEditModal } from "@/components/modals/UserEditModal"
import { UserCreateModal } from "@/components/modals/UserCreateModal"
import { DeactivateUserModal } from "@/components/modals/DeactivateUserModal"
import { Button } from "@/components/ui/button"
import { countries } from "@/lib/countries"
import { getUsers, updateUser, deactivateUser, reactivateUser } from "@/services/user.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { Profile } from "@/types"
import type { UserEditValues } from "@/schemas/user.schema"

interface UsersTableProps {
  currentUserRole: "admin" | "user"
}

export function UsersTable({ currentUserRole }: UsersTableProps) {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [togglingUser, setTogglingUser] = useState<Profile | null>(null)
  const [creating, setCreating] = useState(false)

  const { data = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: getUsers,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserEditValues }) =>
      updateUser(id, {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone || null,
        country_code: values.country_code || null,
        role: values.role,
      }),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.USERS })
      const prev = queryClient.getQueryData<Profile[]>(QUERY_KEYS.USERS)
      queryClient.setQueryData<Profile[]>(QUERY_KEYS.USERS, (old = []) =>
        old.map((u) =>
          u.id === id
            ? {
                ...u,
                first_name: values.first_name,
                last_name: values.last_name,
                phone: values.phone || null,
                country_code: values.country_code || null,
                role: values.role,
              }
            : u
        )
      )
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.USERS, ctx?.prev)
      toast.error(e.message || "Update failed.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS })
    },
  })

  const createMutation = useMutation({
    mutationFn: (values: UserCreateValues) => createUser(values),
    onSuccess: (newUser) => {
      queryClient.setQueryData<Profile[]>(QUERY_KEYS.USERS, (old = []) => [newUser, ...old])
      toast.success("User created.")
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create user."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? deactivateUser(id) : reactivateUser(id),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.USERS })
      const prev = queryClient.getQueryData<Profile[]>(QUERY_KEYS.USERS)
      queryClient.setQueryData<Profile[]>(QUERY_KEYS.USERS, (old = []) =>
        old.map((u) => (u.id === id ? { ...u, is_active: !isActive } : u))
      )
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.USERS, ctx?.prev)
      toast.error(e.message || "Action failed.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS })
    },
  })

  const { data = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: getUsers,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserEditValues }) =>
      updateUser(id, {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone || null,
        country_code: values.country_code || null,
        role: values.role,
      }),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.USERS })
      const prev = queryClient.getQueryData<Profile[]>(QUERY_KEYS.USERS)
      queryClient.setQueryData<Profile[]>(QUERY_KEYS.USERS, (old = []) =>
        old.map((u) =>
          u.id === id
            ? {
                ...u,
                first_name: values.first_name,
                last_name: values.last_name,
                phone: values.phone || null,
                country_code: values.country_code || null,
                role: values.role,
              }
            : u
        )
      )
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.USERS, ctx?.prev)
      toast.error(e.message || "Update failed.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? deactivateUser(id) : reactivateUser(id),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.USERS })
      const prev = queryClient.getQueryData<Profile[]>(QUERY_KEYS.USERS)
      queryClient.setQueryData<Profile[]>(QUERY_KEYS.USERS, (old = []) =>
        old.map((u) => (u.id === id ? { ...u, is_active: !isActive } : u))
      )
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.USERS, ctx?.prev)
      toast.error(e.message || "Action failed.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS })
    },
  })

  const columns: ColumnDef<Profile>[] = [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => {
        const { first_name, last_name } = row.original
        const name = [first_name, last_name].filter(Boolean).join(" ")
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
              {(name || "?")[0].toUpperCase()}
            </div>
            <span className="font-medium text-zinc-900">{name || "—"}</span>
          </div>
        )
      },
    },
    {
      id: "email",
      header: "Email",
      cell: ({ row }) =>
        row.original.email ? (
          <span className="text-sm text-zinc-600">{row.original.email}</span>
        ) : (
          <span className="text-zinc-300">—</span>
        ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) =>
        row.original.phone ? (
          <span className="text-sm text-zinc-600">{row.original.phone}</span>
        ) : (
          <span className="text-zinc-300">—</span>
        ),
    },
    {
      id: "country",
      header: "Country",
      cell: ({ row }) => {
        const code = row.original.country_code
        if (!code) return <span className="text-zinc-300">—</span>
        const country = countries.find((c) => c.code === code)
        return <span className="text-sm text-zinc-600">{country?.name ?? code}</span>
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      enableSorting: true,
      cell: ({ row }) => (
        <span
          className={
            row.original.role === "admin"
              ? "rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white"
              : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600"
          }
        >
          {row.original.role}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.is_active ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
            Inactive
          </span>
        ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      enableSorting: true,
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setEditingUser(user)}
              title="Edit user"
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
              <Pencil className="size-3.5" />
            </button>
            {user.is_active ? (
              <button
                onClick={() => setTogglingUser(user)}
                title="Deactivate user"
                className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <UserX className="size-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setTogglingUser(user)}
                title="Reactivate user"
                className="rounded-md p-1.5 text-zinc-400 hover:bg-green-50 hover:text-green-600 transition-colors"
              >
                <UserCheck className="size-3.5" />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        emptyMessage={isLoading ? "Loading…" : "No users found."}
      />

      <UserEditModal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        currentUserRole={currentUserRole}
        onSave={(values) => updateMutation.mutateAsync({ id: editingUser!.id, values })}
        onSuccess={() => setEditingUser(null)}
      />

      <DeactivateUserModal
        open={!!togglingUser}
        onClose={() => setTogglingUser(null)}
        user={togglingUser}
        onConfirm={() =>
          toggleMutation.mutateAsync({ id: togglingUser!.id, isActive: togglingUser!.is_active })
        }
        isPending={toggleMutation.isPending}
        onSuccess={() => setTogglingUser(null)}
      />
    </>
  )
}
