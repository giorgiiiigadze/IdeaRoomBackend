"use client"

import { useEffect, useMemo, useState } from "react"
import { getUsers } from "@/lib/actions/users"
import { type User } from "@supabase/supabase-js"
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import {
  ColumnDef,
  ColumnOrderState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { SheetPanel } from "@/components/Sheet/Sheet"
import { Plus } from "lucide-react"
import AdminForm from "@/components/Admins/AdminForm"

export default function AdminsPage() {
  "use no memo"

  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: "email", desc: false },
  ])
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

  const fetchUsers = async () => {
    getUsers().then((res) => {
      if (res.error) setError(res.error)
      else setUsers(res.users ?? [])
    })
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "email",
        id: "email",
        header: "Email",
        cell: (info) => (
          <span className="text-blue-600 dark:text-blue-400">{(info.getValue() as string) ?? "—"}</span>
        ),
        size: 260,
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: "Created At",
        cell: (info) => (
          <span className="text-muted-foreground">
            {new Date(info.getValue() as string).toLocaleDateString()}
          </span>
        ),
        size: 140,
      },
      {
        accessorKey: "last_sign_in_at",
        id: "last_sign_in_at",
        header: "Last Sign In",
        cell: (info) => {
          const val = info.getValue() as string | null
          return (
            <span className="text-muted-foreground">
              {val ? new Date(val).toLocaleDateString() : "—"}
            </span>
          )
        },
        size: 140,
      },
      {
        id: "display_name",
        header: "Display Name",
        accessorFn: (row) =>
          (row.user_metadata?.display_name as string) ?? null,
        cell: (info) => (
          <span className="text-muted-foreground">
            {(info.getValue() as string) ?? "—"}
          </span>
        ),
        size: 160,
      },
    ],
    []
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: users,
    pageCount: Math.ceil(users.length / pagination.pageSize),
    getRowId: (row: User) => row.id,
    state: { pagination, sorting, columnOrder },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (error) return <div className="p-6 text-destructive">Error: {error}</div>

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admins</h1>
          <p className="text-sm text-muted-foreground">
            Manage admin accounts —{" "}
            {users.length} user{users.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus />
          Add Admin
        </Button>
      </div>

      <DataGrid
        table={table}
        recordCount={users.length}
        tableLayout={{ cellBorder: true }}
      >
        <div className="w-full">
          <DataGridContainer>
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
          <DataGridPagination className="mt-2"/>
        </div>
      </DataGrid>

      <SheetPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Add Admin"
        description="Create a new admin user account."
        side="right"
        className="w-[500px] sm:max-w-[500px] p-4"
      >
        <AdminForm
          onSuccess={() => {
            setSheetOpen(false)
            fetchUsers()
          }}
        />
      </SheetPanel>
    </div>
  )
}