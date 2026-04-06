"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SheetPanel } from "@/components/Sheet/Sheet"

type Blog = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  author: string
  is_published: boolean
  published_at: string
  created_at: string
}

const columns: ColumnDef<Blog>[] = [
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
    accessorKey: "excerpt",
    header: "Excerpt",
    cell: ({ row }) => (
      <span className="max-w-[250px] truncate block">
        {row.getValue("excerpt") ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{row.getValue("author")}</span>
    ),
  },
  {
    accessorKey: "is_published",
    header: "Status",
    cell: ({ row }) => {
      const published = row.getValue("is_published") as boolean
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
    accessorKey: "published_at",
    header: "Published At",
    cell: ({ row }) =>
      new Date(row.getValue("published_at")).toLocaleDateString(),
  },
]

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("blogs").select("*")
      if (error) setError(error.message)
      else setBlogs(data ?? [])
    }
    fetchData()
  }, [])

  if (error) return <div className="p-6 text-destructive">Error: {error}</div>

  const publishedCount = blogs.filter((b) => b.is_published).length
  const draftCount = blogs.filter((b) => !b.is_published).length

  return (
    <div className="w-full p-6">
      <Tabs defaultValue="all" className="w-full flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">
              Published <Badge variant="secondary">{publishedCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="drafts">
              Drafts <Badge variant="secondary">{draftCount}</Badge>
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => setSheetOpen(true)}>
            <Plus />
            Add
          </Button>
        </div>

        <TabsContent value="all" className="flex flex-col gap-4">
          <DataTable
            data={blogs}
            columns={columns}
            addLabel="Add Blog"
            onAdd={() => console.log("add")}
          />
        </TabsContent>

        <TabsContent value="published" className="flex flex-col gap-4">
          <DataTable
            data={blogs.filter((b) => b.is_published)}
            columns={columns}
            addLabel="Add Blog"
          />
        </TabsContent>

        <TabsContent value="drafts" className="flex flex-col gap-4">
          <DataTable
            data={blogs.filter((b) => !b.is_published)}
            columns={columns}
            addLabel="Add Blog"
          />
        </TabsContent>
      </Tabs>

      <SheetPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Add blog"
        description="Fill in the details to add a new blog."
        side="right"
        className="w-[500px] sm:max-w-[500px] p-4"
      >
        adadad
      </SheetPanel>
    </div>
  )
}