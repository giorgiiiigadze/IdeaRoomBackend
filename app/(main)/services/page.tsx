"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { type ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react"
import { SheetPanel } from "@/components/Sheet/Sheet"
import { ServiceForm } from "@/components/Services/ServicesForm"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

type Service = {
  id: string
  title: string
  description: string
  image: string | null
  badge: string | null
  icon: string | null
  slug: string
  is_active: boolean
  created_at: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("services").select("*")
    if (error) setError(error.message)
    else setServices(data ?? [])
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete(id: string, title: string) {
    const supabase = createClient()
    const { error } = await supabase.from("services").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete", { description: error.message })
    } else {
      toast.success("Service deleted", { description: `"${title}" was removed.` })
      fetchData()
    }
  }

  const columns: ColumnDef<Service>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
        const url = row.getValue("image") as string | null
        return url ? (
          <img src={url} alt="Service image" className="size-10 rounded-full object-cover" />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "icon",
      header: "Icon",
      cell: ({ row }) => {
        const icon = row.getValue("icon") as string | null
        return icon ? (
          <img src={icon} alt="Icon" className="size-8 object-contain" />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap">{row.getValue("title")}</span>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">{row.getValue("slug")}</span>
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
            className={
              active
                ? "text-green-600 border-green-300 bg-green-50 gap-1"
                : "text-muted-foreground gap-1"
            }
          >
            <span
              className={`size-1.5 rounded-full inline-block ${
                active ? "bg-green-500" : "bg-muted-foreground"
              }`}
            />
            {active ? "Active" : "Inactive"}
          </Badge>
        )
      },
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
            <DropdownMenuItem className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => handleDelete(row.original.id, row.original.title)}
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

  const activeCount = services.filter((s) => s.is_active).length
  const inactiveCount = services.filter((s) => !s.is_active).length

  return (
    <div className="w-full p-6">
      <Tabs defaultValue="all" className="w-full flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All ({services.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveCount})</TabsTrigger>
          </TabsList>

          <Button onClick={() => setSheetOpen(true)}>
            <Plus />
            Add Service
          </Button>
        </div>

        <TabsContent value="all" className="flex flex-col gap-4">
          <DataTable data={services} columns={columns} />
        </TabsContent>
        <TabsContent value="active" className="flex flex-col gap-4">
          <DataTable data={services.filter((s) => s.is_active)} columns={columns} />
        </TabsContent>
        <TabsContent value="inactive" className="flex flex-col gap-4">
          <DataTable data={services.filter((s) => !s.is_active)} columns={columns} />
        </TabsContent>
      </Tabs>

      <SheetPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Add Service"
        description="Fill in the details to add a new service."
        side="right"
        className="w-[500px] sm:max-w-[500px] p-4"
      >
        <ServiceForm onSuccess={() => {
          setSheetOpen(false)
          fetchData()
        }} />
      </SheetPanel>
    </div>
  )
}