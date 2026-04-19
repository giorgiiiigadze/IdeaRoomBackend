"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react"
import { SheetPanel } from "@/components/Sheet/Sheet"
import { WorkForm } from "@/components/Works/WorksForm"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

type Work = {
  id: string
  slug: string
  title: string
  title_ka: string | null
  category: string
  category_ka: string | null
  image: string
  description: string | null
  description_ka: string | null
  client: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export default function WorksPage() {
  const [works, setWorks] = useState<Work[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingWork, setEditingWork] = useState<Work | null>(null)
  const [lang, setLang] = useState<"en" | "ka">("en")

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("works").select("*")
    if (error) setError(error.message)
    else setWorks(data ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase.from("works").select("*")
      if (cancelled) return
      if (error) setError(error.message)
      else setWorks(data ?? [])
    }

    load()
    return () => { cancelled = true }
  }, [])

  async function removeStorageImage(image: string | null) {
    if (!image) return
    const supabase = createClient()

    try {
      const url = new URL(image)
      const pathParts = url.pathname.split("/public/works-images/")
      if (pathParts.length < 2) {
        toast.error("Could not parse image path")
        return
      }

      const filePath = decodeURIComponent(pathParts[1])
      const { error } = await supabase.storage.from("works-images").remove([filePath])

      if (error) {
        toast.error("Failed to remove image from storage", { description: error.message })
      }
    } catch {
      toast.error("Invalid image URL")
    }
  }

  async function handleDelete(id: string, title: string, image: string | null) {
    const supabase = createClient()
    const { error } = await supabase.from("works").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete", { description: error.message })
    } else {
      await removeStorageImage(image)
      toast.success("Work deleted", { description: `"${title}" was removed.` })
      fetchData()
    }
  }

  function handleEdit(work: Work) {
    setEditingWork(work)
    setSheetOpen(true)
  }

  function handleSheetClose(open: boolean) {
    setSheetOpen(open)
    if (!open) setEditingWork(null)
  }

  const columns: ColumnDef<Work>[] = [
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
          <img src={url} alt="Work" className="size-10 rounded-full object-cover" />
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
      accessorKey: "category",
      header: "კატეგორიები",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {lang === "ka"
            ? (row.original.category_ka ?? row.original.category)
            : row.original.category}
        </span>
      ),
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
      accessorKey: "client",
      header: "კლიენტი",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.getValue("client") ?? "—"}</span>
      ),
    },
    {
      accessorKey: "published",
      header: "სტატუსი",
      cell: ({ row }) => {
        const published = row.getValue("published") as boolean
        return (
          <Badge
            variant="outline"
            className={
              published
                ? "text-green-600 border-green-300 bg-green-50 gap-1"
                : "text-muted-foreground gap-1"
            }
          >
            <span
              className={`size-1.5 rounded-full inline-block ${
                published ? "bg-green-500" : "bg-muted-foreground"
              }`}
            />
            {published ? "Published" : "Draft"}
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
            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => handleDelete(row.original.id, row.original.title, row.original.image)}
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

  const publishedCount = works.filter((w) => w.published).length
  const draftCount = works.filter((w) => !w.published).length

  return (
    <div className="w-full p-6">
      <Tabs defaultValue="all" className="w-full flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
            <TabsTrigger value="all">ყველა</TabsTrigger>
            <TabsTrigger value="published">
              გამოქვეყნებულები <Badge variant="secondary">{publishedCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="drafts">
              დრაფტები <Badge variant="secondary">{draftCount}</Badge>
            </TabsTrigger>
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

            <Button onClick={() => setSheetOpen(true)}>
              <Plus />
              დაამატე სამუშაო
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="flex flex-col gap-4">
          <DataTable data={works} columns={columns} />
        </TabsContent>

        <TabsContent value="published" className="flex flex-col gap-4">
          <DataTable data={works.filter((w) => w.published)} columns={columns} />
        </TabsContent>

        <TabsContent value="drafts" className="flex flex-col gap-4">
          <DataTable data={works.filter((w) => !w.published)} columns={columns} />
        </TabsContent>
      </Tabs>

      <SheetPanel
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        title={editingWork ? "დააედითე სამუშაო" : "დაამატე სამუშაო"}
        description={
          editingWork
            ? "დაააფდეითე სამუშაოს დეტალები."
            : "შეავსე ინფორმაცია რომ დაამატო სამუშაო."
        }
        side="right"
        className="w-[500px] sm:max-w-[500px] p-4"
      >
        <WorkForm
          work={editingWork}
          onSuccess={() => {
            setSheetOpen(false)
            setEditingWork(null)
            fetchData()
          }}
        />
      </SheetPanel>
    </div>
  )
}