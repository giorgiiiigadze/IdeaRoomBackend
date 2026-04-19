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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

import { ProjectForm } from "@/components/Projects/ProjectForm"
import { ProjectVideos } from "@/components/Projects/ProjectVideos"

export type Project = {
  id: string
  title: string
  title_ka: string | null
  description: string | null
  description_ka: string | null
  service_id: string

  status: "active" | "inactive" | "completed" | "archived"

  slug: string | null
  main_video: string | null

  created_at: string
  updated_at: string

  services?: {
    id: string
    title: string
  } | null

  videos?: {
    count: number
  }[]
}

const statusConfig: Record<
  Project["status"],
  { label: string; className: string; dotClass: string }
> = {
  active: {
    label: "Active",
    className: "text-green-600 border-green-300 bg-green-50 gap-1",
    dotClass: "bg-green-500",
  },
  completed: {
    label: "Completed",
    className: "text-blue-600 border-blue-300 bg-blue-50 gap-1",
    dotClass: "bg-blue-500",
  },
  inactive: {
    label: "Inactive",
    className: "text-muted-foreground gap-1",
    dotClass: "bg-muted-foreground",
  },
  archived: {
    label: "Archived",
    className: "text-yellow-600 border-yellow-300 bg-yellow-50 gap-1",
    dotClass: "bg-yellow-500",
  },
}

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [lang, setLang] = useState<"en" | "ka">("en")

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("projects")
      .select("*, services(*), videos(count)")

    if (error) setError(error.message)
    else setProjects(data ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("projects")
        .select("*, services(*), videos(count)")

      if (cancelled) return
      if (error) setError(error.message)
      else setProjects(data ?? [])
    }

    load()
    return () => { cancelled = true }
  }, [])

  async function handleDelete(id: string, title: string) {
    const supabase = createClient()

    const { data: videos, error: fetchError } = await supabase
      .from("videos")
      .select("file_path")
      .eq("project_id", id)

    if (fetchError) {
      toast.error("Failed to fetch project videos", { description: fetchError.message })
      return
    }

    if (videos && videos.length > 0) {
      const filePaths = videos.map((v) => v.file_path)
      const { error: storageError } = await supabase.storage
        .from("projects-videos")
        .remove(filePaths)

      if (storageError) {
        toast.error("Failed to delete video files", { description: storageError.message })
        return
      }
    }

    const { error } = await supabase.from("projects").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete", { description: error.message })
    } else {
      toast.success("Project deleted", { description: `"${title}" was removed.` })
      fetchData()
    }
  }

  function handleEdit(project: Project) {
    setEditingProject(project)
    setSheetOpen(true)
  }

  function handleSheetClose(open: boolean) {
    setSheetOpen(open)
    if (!open) setEditingProject(null)
  }

  function toggleRow(id: string) {
    setExpandedRow((prev) => (prev === id ? null : id))
  }

  function renderExpanded(project: Project) {
    return <ProjectVideos projectId={project.id} />
  }

  const columns: ColumnDef<Project>[] = [
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
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
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
      id: "service",
      header: "სერვიცი",
      cell: ({ row }) => {
        const service = row.original.services
        const serviceName = service?.title ?? null
        return serviceName ? (
          <Badge variant="outline" className="whitespace-nowrap">
            {serviceName}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "slug",
      header: "ლინკის სახელი(slug)",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap">{row.getValue("slug")}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "აღწერა",
      cell: ({ row }) => {
        const description =
          lang === "ka"
            ? (row.original.description_ka ?? row.original.description)
            : row.original.description
        return description ? (
          <span
            className="text-muted-foreground max-w-[300px] truncate block"
            title={description}
          >
            {description}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      id: "hasVideo",
      header: "ვიდეო",
      cell: ({ row }) => {
        const hasVideo = !!row.original.main_video

        return (
          <Badge variant={hasVideo ? "default" : "secondary"}>
            {hasVideo ? "Yes" : "No"}
          </Badge>
        )
      },
    },
    {
      id: "videos",
      header: "ვიდეოები",
      cell: ({ row }) => {
        const count = row.original.videos?.[0]?.count ?? 0
        return (
          <Badge variant="secondary" className="gap-1">
            {count} {count === 1 ? "video" : "videos"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "სტატუსი",
      cell: ({ row }) => {
        const status = row.getValue("status") as Project["status"]
        const config = statusConfig[status]
        return (
          <Badge variant="outline" className={config.className}>
            <span className={`size-1.5 rounded-full inline-block ${config.dotClass}`} />
            {config.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "შექმნის თარიღი",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return (
          <span className="text-muted-foreground whitespace-nowrap text-sm">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(row.original)}>
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

  const activeCount    = projects.filter((p) => p.status === "active").length
  const completedCount = projects.filter((p) => p.status === "completed").length
  const archivedCount  = projects.filter((p) => p.status === "archived").length

  return (
    <div className="w-full p-6">
      <Tabs defaultValue="all" className="w-full flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
            <TabsTrigger value="all">ყველა</TabsTrigger>
            <TabsTrigger value="active">
              აქტიურები <Badge variant="secondary">{activeCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              დამთავრებულები <Badge variant="secondary">{completedCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archived">
              დაარქივებულები <Badge variant="secondary">{archivedCount}</Badge>
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
              დაამატე პროექტი
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="flex flex-col gap-4">
          <DataTable
            data={projects}
            columns={columns}
            expandedRow={expandedRow}
            onToggleRow={toggleRow}
            renderExpanded={renderExpanded}
          />
        </TabsContent>

        <TabsContent value="active" className="flex flex-col gap-4">
          <DataTable
            data={projects.filter((p) => p.status === "active")}
            columns={columns}
            expandedRow={expandedRow}
            onToggleRow={toggleRow}
            renderExpanded={renderExpanded}
          />
        </TabsContent>

        <TabsContent value="completed" className="flex flex-col gap-4">
          <DataTable
            data={projects.filter((p) => p.status === "completed")}
            columns={columns}
            expandedRow={expandedRow}
            onToggleRow={toggleRow}
            renderExpanded={renderExpanded}
          />
        </TabsContent>

        <TabsContent value="archived" className="flex flex-col gap-4">
          <DataTable
            data={projects.filter((p) => p.status === "archived")}
            columns={columns}
            expandedRow={expandedRow}
            onToggleRow={toggleRow}
            renderExpanded={renderExpanded}
          />
        </TabsContent>
      </Tabs>

      <SheetPanel
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        title={editingProject ? "დააედითე პროექტი" : "შექმენი პროექტი"}
        description={
          editingProject
            ? "დაააფდეითე პროექტის დეტალები."
            : "ჩაწერე ინფორმაცია რომ დაამატო ახალი პროექტი."
        }
        side="right"
        className="w-[500px] sm:max-w-[500px] p-4"
      >
        <ProjectForm
          project={editingProject}
          onSuccess={() => {
            setSheetOpen(false)
            setEditingProject(null)
            fetchData()
          }}
        />
      </SheetPanel>
    </div>
  )
}