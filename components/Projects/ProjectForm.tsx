"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Check, Upload } from "lucide-react"

type Service = {
  id: string
  title: string
}

type Project = {
  id: string
  title: string
  title_ka: string | null
  description: string | null
  description_ka: string | null
  service_id: string
  status: "active" | "inactive" | "completed" | "archived"
  slug: string | null
  main_video?: string | null
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

type LangForm = {
  title: string
  description: string
}

function isLangFormFilled(f: LangForm) {
  return f.title.trim() !== ""
}

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
  const [activeTab, setActiveTab]             = useState<"en" | "ka">("en")
  const [error, setError]                     = useState<string | null>(null)

  const [formEn, setFormEn] = useState<LangForm>({
    title: project?.title ?? "",
    description: project?.description ?? "",
  })

  const [formKa, setFormKa] = useState<LangForm>({
    title: project?.title_ka ?? "",
    description: project?.description_ka ?? "",
  })

  const [serviceId, setServiceId]   = useState(project?.service_id ?? "")
  const [status, setStatus]         = useState<Project["status"]>(project?.status ?? "active")
  const [customSlug, setCustomSlug] = useState(project?.slug ?? "")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const [videoFile, setVideoFile]       = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)

  const slug = slugManuallyEdited ? customSlug : generateSlug(formEn.title)

  const enFilled   = isLangFormFilled(formEn)
  const kaFilled   = isLangFormFilled(formKa)
  const bothFilled = enFilled && kaFilled

  const supabase = createClient()

  const currentVideo = project?.main_video
    ? supabase.storage
        .from("projects-videos")
        .getPublicUrl(project.main_video).data?.publicUrl ?? null
    : null

  useEffect(() => {
    async function fetchServices() {
      const supabase = createClient()
      const { data, error } = await supabase.from("services").select("id, title")
      if (error) toast.error("Failed to load services", { description: error.message })
      else setServices(data ?? [])
      setLoadingServices(false)
    }
    fetchServices()
  }, [])

  function handleChangeEn(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormEn((prev) => ({ ...prev, [name]: value }))
    if (name === "title" && !slugManuallyEdited) {
      setCustomSlug(generateSlug(value))
    }
  }

  function handleChangeKa(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormKa((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!enFilled) {
      setActiveTab("en")
      setError("Please fill in the English title.")
      return
    }
    if (!kaFilled) {
      setActiveTab("ka")
      setError("Please fill in the Georgian title.")
      return
    }
    if (!serviceId) {
      toast.error("Please select a service")
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    let main_video: string | null = project?.main_video ?? null

    if (videoFile) {
      const ext = videoFile.name.split(".").pop()
      const fileName = `${slug || "project"}-main-video.${ext}`
      const filePath = `main-videos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("projects-videos")
        .upload(filePath, videoFile, { upsert: true })

      if (uploadError) {
        toast.error("Failed to upload video", { description: uploadError.message })
        setSubmitting(false)
        return
      }

      main_video = filePath
    }

    const payload = {
      title:          formEn.title.trim(),
      title_ka:       formKa.title.trim(),
      description:    formEn.description.trim() || null,
      description_ka: formKa.description.trim() || null,
      service_id:     serviceId,
      status,
      slug:           slug.trim() || null,
      main_video,
    }

    if (isEditing) {
      const { error } = await supabase.from("projects").update(payload).eq("id", project.id)
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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "en" | "ka")}>
        <TabsList className="w-full">
          <TabsTrigger value="en" className="flex-1 gap-2">
            English
            {enFilled ? (
              <Badge variant="secondary" className="text-green-600 border-green-300 bg-green-50 text-xs px-1.5 py-0">
                <Check className="size-3" />
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-muted-foreground text-xs px-1.5 py-0">
                Required
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ka" className="flex-1 gap-2">
            Georgian
            {kaFilled ? (
              <Badge variant="secondary" className="text-green-600 border-green-300 bg-green-50 text-xs px-1.5 py-0">
                <Check className="size-3" />
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-muted-foreground text-xs px-1.5 py-0">
                Required
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="en" className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="en-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="en-title"
              name="title"
              placeholder="e.g. E-Commerce Platform"
              value={formEn.title}
              onChange={handleChangeEn}
              disabled={submitting}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="en-description">Description</Label>
            <Textarea
              id="en-description"
              name="description"
              placeholder="Brief description of the project..."
              value={formEn.description}
              onChange={handleChangeEn}
              disabled={submitting}
              rows={4}
              className="resize-none"
            />
          </div>
        </TabsContent>

        <TabsContent value="ka" className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ka-title">სათაური <span className="text-destructive">*</span></Label>
            <Input
              id="ka-title"
              name="title"
              placeholder="მაგ. ელ-კომერცია პლატფორმა"
              value={formKa.title}
              onChange={handleChangeKa}
              disabled={submitting}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ka-description">აღწერა</Label>
            <Textarea
              id="ka-description"
              name="description"
              placeholder="პროექტის მოკლე აღწერა..."
              value={formKa.description}
              onChange={handleChangeKa}
              disabled={submitting}
              rows={4}
              className="resize-none"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          placeholder="e.g. e-commerce-platform"
          value={slug}
          onChange={(e) => { setCustomSlug(e.target.value); setSlugManuallyEdited(true) }}
          onBlur={(e) => setCustomSlug(generateSlug(e.target.value))}
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground">
          Auto-generated from English title. You can override it manually.
        </p>
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
                <div className="px-3 py-2 text-sm text-muted-foreground">No services found</div>
              ) : (
                services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>{service.title}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(val) => setStatus(val as Project["status"])} disabled={submitting}>
          <SelectTrigger id="status"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Main Video</Label>

        {isEditing && currentVideo && !videoFile && (
          <div className="rounded-lg overflow-hidden aspect-video w-full bg-black">
            <video src={currentVideo} controls className="w-full h-full object-cover" />
          </div>
        )}

        {videoPreview && (
          <div className="rounded-lg overflow-hidden aspect-video w-full bg-black">
            <video src={videoPreview} controls className="w-full h-full object-cover" />
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-4 hover:bg-muted/40 transition-colors">
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {videoFile ? videoFile.name : isEditing && project?.main_video ? "Click to replace video" : "Click to upload a main video"}
          </span>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoChange}
            disabled={submitting}
          />
        </label>

        {isEditing && (
          <p className="text-xs text-muted-foreground">
            Upload a new video to replace the current one, or leave empty to keep it.
          </p>
        )}
      </div>

      {!bothFilled && (
        <p className="text-xs text-muted-foreground">
          Both English and Georgian titles must be filled before saving.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting || loadingServices || !bothFilled} className="mt-2">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isEditing ? "Save Changes" : "Create Project"}
      </Button>
    </form>
  )
}