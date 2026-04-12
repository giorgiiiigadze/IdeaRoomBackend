"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type Service = {
  id: string
  title: string
}

type Project = {
  id: string
  title: string
  description: string | null
  service_id: string
  status: "active" | "inactive" | "completed" | "archived"
  slug: string | null
}

type ProjectFormProps = {
  project?: Project | null
  onSuccess: () => void
}

const STATUS_OPTIONS: { value: Project["status"]; label: string }[] = [
  { value: "active",    label: "Active" },
  { value: "inactive",  label: "Inactive" },
  { value: "completed", label: "Completed" },
  { value: "archived",  label: "Archived" },
]

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const isEditing = !!project

  const [services, setServices]               = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [submitting, setSubmitting]           = useState(false)

  const [title, setTitle]             = useState(project?.title ?? "")
  const [description, setDescription] = useState(project?.description ?? "")
  const [serviceId, setServiceId]     = useState(project?.service_id ?? "")
  const [status, setStatus]           = useState<Project["status"]>(project?.status ?? "active")
  const [customSlug, setCustomSlug]   = useState(project?.slug ?? "")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const slug = slugManuallyEdited ? customSlug : generateSlug(title)

  useEffect(() => {
    async function fetchServices() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("services")
        .select("id, title")

      if (error) {
        toast.error("Failed to load services", { description: error.message })
      } else {
        setServices(data ?? [])
      }
      setLoadingServices(false)
    }

    fetchServices()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!serviceId) {
      toast.error("Please select a service")
      return
    }

    if (!slug.trim()) {
      toast.error("Slug is required")
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      service_id: serviceId,
      status,
      slug: slug.trim() || null,
    }

    if (isEditing) {
      const { error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", project.id)

      if (error) {
        toast.error("Failed to update project", { description: error.message })
      } else {
        toast.success("Project updated", { description: `"${payload.title}" was updated.` })
        onSuccess()
      }
    } else {
      const { error } = await supabase.from("projects").insert(payload)

      if (error) {
        toast.error("Failed to create project", { description: error.message })
      } else {
        toast.success("Project created", { description: `"${payload.title}" was added.` })
        onSuccess()
      }
    }

    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
        <Input
          id="title"
          placeholder="e.g. E-Commerce Platform"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          placeholder="e.g. e-commerce-platform"
          value={slug}
          onChange={(e) => {
            setCustomSlug(e.target.value)
            setSlugManuallyEdited(true)
          }}
          onBlur={(e) => setCustomSlug(generateSlug(e.target.value))}
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground">
          Auto-generated from title. You can override it manually.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the project..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
          rows={4}
          className="resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="service">Service <span className="text-destructive">*</span></Label>
        {loadingServices ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading services...
          </div>
        ) : (
          <Select value={serviceId} onValueChange={setServiceId} disabled={submitting}>
            <SelectTrigger id="service">
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              {services.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No services found
                </div>
              ) : (
                services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onValueChange={(val) => setStatus(val as Project["status"])}
          disabled={submitting}
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={submitting || loadingServices} className="mt-2">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isEditing ? "Save Changes" : "Create Project"}
      </Button>

    </form>
  )
}