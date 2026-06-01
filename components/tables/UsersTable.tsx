"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Pencil,
  UserX,
  UserCheck,
  UserPlus,
  MailCheck,
  Send,
  KeyRound,
  Trash2,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "./DataTable"
import { UserEditModal } from "@/components/modals/UserEditModal"
import { UserCreateModal } from "@/components/modals/UserCreateModal"
import { DeactivateUserModal } from "@/components/modals/DeactivateUserModal"
import { DeleteUserModal } from "@/components/modals/DeleteUserModal"
import { Button } from "@/components/ui/button"
import { countries } from "@/lib/countries"
import {
  getUsers,
  updateUser,
  deactivateUser,
  reactivateUser,
  createUser,
  resendVerificationEmail,
  resetPasswordForUser,
  deleteUser,
} from "@/services/user.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { Profile } from "@/types"
import type { UserEditValues, UserCreateValues } from "@/schemas/user.schema"


// ---------------------------------------------------------------------------
// Main table
// ---------------------------------------------------------------------------

interface UsersTableProps {
  currentUserRole: "admin" | "user"
  currentUserId?: string
}

type StatusFilter = "all" | "active" | "inactive" | "verified" | "pending"

export function UsersTable({ currentUserRole, currentUserId }: UsersTableProps) {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [togglingUser, setTogglingUser] = useState<Profile | null>(null)
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const { data = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: getUsers,
  })

  const filtered = data.filter((u) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ").toLowerCase()
    const email = (u.email ?? "").toLowerCase()
    const q = search.toLowerCase().trim()
    if (q && !name.includes(q) && !email.includes(q)) return false
    if (statusFilter === "active" && !u.is_active) return false
    if (statusFilter === "inactive" && u.is_active) return false
    if (statusFilter === "verified" && !u.email_confirmed_at) return false
    if (statusFilter === "pending" && u.email_confirmed_at) return false
    return true
  })

  // ---- mutations -----------------------------------------------------------

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
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS }),
  })

  const createMutation = useMutation({
    mutationFn: (values: UserCreateValues) =>
      createUser({
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        country_code: values.country_code,
        role: values.role,
      }),
    onSuccess: (newUser) => {
      queryClient.setQueryData<Profile[]>(QUERY_KEYS.USERS, (old = []) => [newUser, ...old])
      toast.success("Invitation sent.")
    },
    onError: (e: Error) => toast.error(e.message || "Failed to invite user."),
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
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? "User deactivated." : "User reactivated.")
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.USERS, ctx?.prev)
      toast.error(e.message || "Action failed.")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS }),
  })

  const resendMutation = useMutation({
    mutationFn: (email: string) => resendVerificationEmail(email),
    onSuccess: () => toast.success("Verification email resent."),
    onError: (e: Error) => toast.error(e.message || "Failed to resend email."),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => resetPasswordForUser(email),
    onSuccess: () => toast.success("Password reset email sent."),
    onError: (e: Error) => toast.error(e.message || "Failed to send reset email."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id, currentUserId ?? ""),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Profile[]>(QUERY_KEYS.USERS, (old = []) =>
        old.filter((u) => u.id !== id)
      )
      toast.success("User deleted.")
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS }),
  })

  // ---- columns -------------------------------------------------------------

  const columns: ColumnDef<Profile>[] = [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => {
        const { first_name, last_name } = row.original
        const name = [first_name, last_name].filter(Boolean).join(" ")
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
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
      id: "verified",
      header: "Email Verified",
      cell: ({ row }) =>
        row.original.email_confirmed_at ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            <MailCheck className="size-3" />
            Verified
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Pending
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
        const isSelf = user.id === currentUserId
        const hasEmail = !!user.email
        const isVerified = !!user.email_confirmed_at

        return (
          <div className="flex items-center justify-end gap-1">
            {/* Edit */}
            <button
              onClick={() => setEditingUser(user)}
              title="Edit"
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              <Pencil className="size-3.5" />
            </button>

            {/* Deactivate / Reactivate */}
            {user.is_active ? (
              <button
                onClick={() => setTogglingUser(user)}
                disabled={isSelf}
                title={isSelf ? "You cannot deactivate your own account." : "Deactivate"}
                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UserX className="size-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setTogglingUser(user)}
                title="Reactivate"
                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-green-50 hover:text-green-600"
              >
                <UserCheck className="size-3.5" />
              </button>
            )}

            {/* Reset Password */}
            <button
              onClick={() => { if (hasEmail) resetPasswordMutation.mutate(user.email!) }}
              disabled={!hasEmail || resetPasswordMutation.isPending}
              title={hasEmail ? "Send password reset email" : "No email on file"}
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <KeyRound className="size-3.5" />
            </button>

            {/* Resend Verification — hidden once verified */}
            {!isVerified && (
              <button
                onClick={() => { if (hasEmail) resendMutation.mutate(user.email!) }}
                disabled={resendMutation.isPending}
                title="Resend verification email"
                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40"
              >
                <Send className="size-3.5" />
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => setDeletingUser(user)}
              disabled={isSelf}
              title={isSelf ? "You cannot delete your own account." : "Delete permanently"}
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-45 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="h-9 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
        >
          <option value="all">All users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending verification</option>
        </select>
        <span className="text-xs text-zinc-400 ml-1">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        {currentUserRole === "admin" && (
          <Button onClick={() => setCreating(true)} className="ml-auto">
            <UserPlus className="size-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="No users found."
      />

      <UserEditModal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        currentUserRole={currentUserRole}
        onSave={(values) => updateMutation.mutateAsync({ id: editingUser!.id, values })}
        onSuccess={() => setEditingUser(null)}
      />

      <UserCreateModal
        open={creating}
        onClose={() => setCreating(false)}
        onSave={(values) => createMutation.mutateAsync(values)}
      />

      <DeactivateUserModal
        open={!!togglingUser}
        onClose={() => setTogglingUser(null)}
        user={togglingUser}
        onConfirm={() =>
          toggleMutation.mutateAsync({
            id: togglingUser!.id,
            isActive: togglingUser!.is_active,
          })
        }
        isPending={toggleMutation.isPending}
        onSuccess={() => setTogglingUser(null)}
      />

      <DeleteUserModal
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        user={deletingUser}
        onConfirm={() => deleteMutation.mutateAsync(deletingUser!.id)}
      />
    </>
  )
}
