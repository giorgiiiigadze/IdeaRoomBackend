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
import { BlogForm } from "@/components/Blogs/BlogsForm"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

type Blog = {
  id: string
  title: string
  slug: string
  author: string
  cover_image_url: string | null
  content: string
  is_published: boolean
  published_at: string
  created_at: string
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("blogs").select("*")
    if (error) setError(error.message)
    else setBlogs(data ?? [])
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function removeStorageImage(coverImageUrl: string | null) {
    if (!coverImageUrl) return
    const supabase = createClient()

    const marker = "/blog-images/"
    const idx = coverImageUrl.indexOf(marker)
    if (idx === -1) return

    const filePath = coverImageUrl.slice(idx + marker.length)
    const { error } = await supabase.storage.from("blog-images").remove([filePath])
    if (error) {
      toast.error("Failed to remove image from storage", { description: error.message })
    }
  }

  async function handleDelete(id: string, title: string, coverImageUrl: string | null) {
    const supabase = createClient()
    const { error } = await supabase.from("blogs").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete", { description: error.message })
    } else {
      await removeStorageImage(coverImageUrl)
      toast.success("Blog deleted", { description: `"${title}" was removed.` })
      fetchData()
    }
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
      accessorKey: "cover_image_url",
      header: "Image",
      cell: ({ row }) => {
        const url = row.getValue("cover_image_url") as string | null
        return url ? (
          <img src={url} alt="Image" className="size-10 rounded-full object-cover" />
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
      accessorKey: "content",
      header: "Content",
      cell: ({ row }) => {
        const content = row.getValue("content") as string
        return (
          <span className="text-muted-foreground whitespace-nowrap">
            {content?.length > 60 ? content.slice(0, 60) + "..." : content}
          </span>
        )
      },
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">{row.getValue("slug")}</span>
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
              onClick={() => handleDelete(row.original.id, row.original.title, row.original.cover_image_url)}
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
            Add Blog
          </Button>
        </div>

        <TabsContent value="all" className="flex flex-col gap-4">
          <DataTable data={blogs} columns={columns} />
        </TabsContent>

        <TabsContent value="published" className="flex flex-col gap-4">
          <DataTable data={blogs.filter((b) => b.is_published)} columns={columns} />
        </TabsContent>

        <TabsContent value="drafts" className="flex flex-col gap-4">
          <DataTable data={blogs.filter((b) => !b.is_published)} columns={columns} />
        </TabsContent>
      </Tabs>

      <SheetPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Add Blog"
        description="Fill in the details to add a new blog post."
        side="right"
        className="w-[500px] sm:max-w-[500px] p-4"
      >
        <BlogForm
          onSuccess={() => {
            setSheetOpen(false)
            fetchData()
          }}
        />
      </SheetPanel>
    </div>
  )
}