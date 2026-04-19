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
  title_ka: string | null
  description: string
  description_ka: string | null
  image: string | null
  badge: string | null
  icon: string | null
  slug: string
  is_active: boolean
  created_at: string
}

function extractStoragePath(url: string | null, folder: string): string | null {
  if (!url) return null
  const marker = `/${folder}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return `${folder}/${url.slice(idx + marker.length)}`
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editData, setEditData] = useState<Service | null>(null)
  const [lang, setLang] = useState<"en" | "ka">("en")

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("services").select("*")
    if (error) setError(error.message)
    else setServices(data ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase.from("services").select("*")
      if (cancelled) return
      if (error) setError(error.message)
      else setServices(data ?? [])
    }

    load()
    return () => { cancelled = true }
  }, [])

  function handleOpenEdit(row: Service) {
    setEditData(row)
    setSheetOpen(true)
  }

  function handleOpenAdd() {
    setEditData(null)
    setSheetOpen(true)
  }

  async function handleDelete(id: string, title: string) {
    const supabase = createClient()

    const { data: service } = await supabase
      .from("services")
      .select("image, icon")
      .eq("id", id)
      .single()

    const { error } = await supabase.from("services").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete", { description: error.message })
      return
    }

    const toRemove = [
      extractStoragePath(service?.image, "service-images"),
      extractStoragePath(service?.icon, "service-icons"),
    ].filter(Boolean) as string[]

    if (toRemove.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("services-images")
        .remove(toRemove)

      if (storageError) {
        toast.warning("Service deleted but failed to remove files from storage", {
          description: storageError.message,
        })
        fetchData()
        return
      }
    }

    toast.success("Service deleted", {
      description: `"${title}" and its files were removed.`,
    })
    fetchData()
  }

  const columns: ColumnDef<Service>[] = [
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
      accessorKey: "image",
      header: "იმიჯი",
      cell: ({ row }) => {
        const url = row.getValue("image") as string | null
        return url ? (
          <img
            src={url}
            alt="Service image"
            className="w-16 h-10 object-cover rounded-md"
          />
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
      header: "სათაური",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap">
          {lang === "ka"
            ? (row.original.title_ka ?? row.original.title)
            : row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "აღწერა",
      cell: ({ row }) => {
        const desc =
          lang === "ka"
            ? (row.original.description_ka ?? row.original.description)
            : row.original.description
        return (
          <span className="text-muted-foreground whitespace-nowrap">
            {desc?.length > 60 ? desc.slice(0, 60) + "..." : desc}
          </span>
        )
      },
    },
    {
      accessorKey: "slug",
      header: "ლინკის სახელი(slug)",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {row.getValue("slug")}
        </span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "სტატუსი",
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
            <DropdownMenuItem
              className="gap-2"
              onClick={() => handleOpenEdit(row.original)}
            >
              <Pencil className="h-4 w-4" />
              დააედითე
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => handleDelete(row.original.id, row.original.title)}
            >
              <Trash2 className="h-4 w-4" />
              წაშალე
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
            <TabsTrigger value="all">ყველა ({services.length})</TabsTrigger>
            <TabsTrigger value="active">აქტიური ({activeCount})</TabsTrigger>
            <TabsTrigger value="inactive">არა აქტიური ({inactiveCount})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border p-0.5 gap-0.5">
              <Button
                variant={lang === "en" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setLang("en")}
              >
                EN
              </Button>
              <Button
                variant={lang === "ka" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setLang("ka")}
              >
                KA
              </Button>
            </div>

            <Button onClick={handleOpenAdd}>
              <Plus />
              დაამატე სერვიცი
            </Button>
          </div>
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
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setEditData(null)
        }}
        title={editData ? "დააედითე სერვისი" : "დაამატე სერვისი"}
        description={
          editData
            ? "დაააფდეითე სერვისის დეტალები."
            : "ჩაწერე ინფორმაცია რომ დაამატო ახალი სერვისი."
        }
        side="right"
        className="w-[500px] sm:max-w-[500px] p-4"
      >
        <ServiceForm
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