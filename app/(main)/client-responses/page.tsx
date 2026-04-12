"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { SheetPanel } from "@/components/Sheet/Sheet"
import { Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react"
import { ClientResponseForm } from "@/components/ClientResponse/ClientResponseForm"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

type ClientResponse = {
  id: string
  name: string
  role: string | null
  quote: string
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export default function ClientResponsePage() {
  const [data, setData] = useState<ClientResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editData, setEditData] = useState<ClientResponse | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("testimonials").select("*")
    if (error) setError(error.message)
    else setData(data ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase.from("testimonials").select("*")
      if (cancelled) return
      if (error) setError(error.message)
      else setData(data ?? [])
    }

    load()
    return () => { cancelled = true }
  }, [])

  function handleOpenEdit(row: ClientResponse) {
    setEditData(row)
    setSheetOpen(true)
  }

  function handleOpenAdd() {
    setEditData(null)
    setSheetOpen(true)
  }

  async function handleDelete(id: string, name: string, avatarUrl: string | null) {
    const supabase = createClient()

    if (avatarUrl) {
      const bucketName = "testimonials-images"
      const urlParts = avatarUrl.split(`${bucketName}/`)
      const filePath = urlParts[1]
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([filePath])
        if (storageError) {
          toast.error("Failed to delete image", { description: storageError.message })
          return
        }
      }
    }

    const { error } = await supabase.from("testimonials").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete", { description: error.message })
    } else {
      toast.success("Testimonial deleted", { description: `"${name}" was removed.` })
      fetchData()
    }
  }

  const columns: ColumnDef<ClientResponse>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "avatar_url",
      header: "Avatar",
      cell: ({ row }) => {
        const url = row.getValue("avatar_url") as string | null
        return url ? (
          <img src={url} alt="Avatar" className="size-10 rounded-full object-cover" />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => row.getValue("role") ?? "—",
    },
    {
      accessorKey: "quote",
      header: "Quote",
      cell: ({ row }) => (
        <span className="max-w-xs truncate block">{row.getValue("quote")}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("is_active") as boolean
        return (
          <Badge
            variant="outline"
            className={active ? "text-green-600 border-green-300 bg-green-50 gap-1" : "text-muted-foreground gap-1"}
          >
            <span className={`size-1.5 rounded-full inline-block ${active ? "bg-green-500" : "bg-muted-foreground"}`} />
            {active ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="gap-2"
              onClick={() => handleOpenEdit(row.original)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => handleDelete(row.original.id, row.original.name, row.original.avatar_url)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]

  if (error) return <div className="p-6 text-destructive">Error: {error}</div>

  const activeCount = data.filter((d) => d.is_active).length
  const inactiveCount = data.filter((d) => !d.is_active).length

  return (
    <div className="w-full p-6">
      <Tabs defaultValue="all" className="w-full flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">
              Active <Badge variant="secondary">{activeCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inactive <Badge variant="secondary">{inactiveCount}</Badge>
            </TabsTrigger>
          </TabsList>

          <Button onClick={handleOpenAdd}>
            <Plus />
            Add Testimonial
          </Button>
        </div>

        <TabsContent value="all" className="flex flex-col gap-4">
          <DataTable data={data} columns={columns} />
        </TabsContent>
        <TabsContent value="active" className="flex flex-col gap-4">
          <DataTable data={data.filter((d) => d.is_active)} columns={columns} />
        </TabsContent>
        <TabsContent value="inactive" className="flex flex-col gap-4">
          <DataTable data={data.filter((d) => !d.is_active)} columns={columns} />
        </TabsContent>
      </Tabs>

      <SheetPanel
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setEditData(null)
        }}
        title={editData ? "Edit Testimonial" : "Add Testimonial"}
        description={editData ? "Update the client response." : "Fill in the details to add a new client response."}
        side="right"
        className="w-[500px] sm:max-w-[500px] p-4"
      >
        <ClientResponseForm
          editData={editData}
          onSuccess={() => {
            setSheetOpen(false)
            setEditData(null)
            fetchData()
          }}
        />
      </SheetPanel>
    </div>
  )
}