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
  title_ka: string | null
  slug: string
  author: string
  cover_image_url: string | null
  content: string
  content_ka: string | null
  is_published: boolean
  published_at: string
  created_at: string
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [lang, setLang] = useState<"en" | "ka">("en")

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("blogs").select("*")
    if (error) setError(error.message)
    else setBlogs(data ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase.from("blogs").select("*")
      if (cancelled) return
      if (error) setError(error.message)
      else setBlogs(data ?? [])
    }

    load()
    return () => { cancelled = true }
  }, [])

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

  function handleEdit(blog: Blog) {
    setEditingBlog(blog)
    setSheetOpen(true)
  }

  function handleSheetClose(open: boolean) {
    setSheetOpen(open)
    if (!open) setEditingBlog(null)
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
      header: "იმიჯი",
      cell: ({ row }) => {
        const url = row.getValue("cover_image_url") as string | null
        return url ? (
          <img src={url} alt="Cover" className="size-10 rounded-full object-cover" />
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
      accessorKey: "content",
      header: "კონტენტი",
      cell: ({ row }) => {
        const content =
          lang === "ka"
            ? (row.original.content_ka ?? row.original.content)
            : row.original.content
        return (
          <span
            className="text-muted-foreground max-w-[300px] truncate block"
            title={content}
          >
            {content}
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
      accessorKey: "author",
      header: "ავტორი",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.getValue("author")}</span>
      ),
    },
    {
      accessorKey: "is_published",
      header: "სტატუსი",
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
            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() =>
                handleDelete(row.original.id, row.original.title, row.original.cover_image_url)
              }
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
              დაამატე ბლოგი
            </Button>
          </div>
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
        onOpenChange={handleSheetClose}
        title={editingBlog ? "დააედითე ბლოგი" : "დაამატე ბლოგი"}
        description={
          editingBlog
            ? "დაააფდეითე ბლოგის ინფორმაციის დეტალები."
            : "შეავსე ინფორმაცია რომ დაამატო ახალი ბლოგი."
        }
        side="right"
        className="w-[500px] sm:max-w-[500px] p-4"
      >
        <BlogForm
          blog={editingBlog}
          onSuccess={() => {
            setSheetOpen(false)
            setEditingBlog(null)
            fetchData()
          }}
        />
      </SheetPanel>
    </div>
  )
}