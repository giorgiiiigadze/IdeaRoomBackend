"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"

interface ServiceFormProps {
  onSuccess: () => void
}

export function ServiceForm({ onSuccess }: ServiceFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    slug: "",
    is_active: true,
  })

  const imageUploadProps = useSupabaseUpload({
    bucketName: 'services-images',
    path: 'service-images',
    allowedMimeTypes: ['image/*'],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10,
  })

  const iconUploadProps = useSupabaseUpload({
    bucketName: 'services-images',
    path: 'service-icons',
    allowedMimeTypes: ['image/*'],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    const slug = title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    setForm((prev) => ({ ...prev, title, slug }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      let image: string | null = null
      let icon: string | null = null

      if (imageUploadProps.files.length > 0) {
        await imageUploadProps.onUpload()
        const file = imageUploadProps.files[0]
        const { data } = supabase.storage
          .from('services-images')
          .getPublicUrl(`service-images/${file.name}`)
        image = data.publicUrl
      }

      if (iconUploadProps.files.length > 0) {
        await iconUploadProps.onUpload()
        const file = iconUploadProps.files[0]
        const { data } = supabase.storage
          .from('services-images')
          .getPublicUrl(`service-icons/${file.name}`)
        icon = data.publicUrl
      }

      const { error } = await supabase.from("services").insert({
        title: form.title,
        description: form.description,
        slug: form.slug,
        image,
        icon,
        is_active: form.is_active,
      })

      if (error) {
        setError(error.message)
        toast.error("Failed to add service", { description: error.message })
        return
      }

      toast.success("Service added", {
        description: `"${form.title}" was added successfully.`,
      })

      setTimeout(() => onSuccess(), 100)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      toast.error("Something went wrong", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
        <Input
          id="title"
          name="title"
          placeholder="Video Editing"
          value={form.title}
          onChange={handleTitleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
        <Input
          id="slug"
          name="slug"
          placeholder="video-editing"
          value={form.slug}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe this service..."
          value={form.description}
          onChange={handleChange}
          rows={4}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Icon Image</Label>
        <Dropzone {...iconUploadProps}>
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Service Image</Label>
        <Dropzone {...imageUploadProps}>
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Active</Label>
        <Switch
          id="is_active"
          checked={form.is_active}
          onCheckedChange={(val) => setForm((prev) => ({ ...prev, is_active: val }))}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Add Service"}
      </Button>
    </form>
  )
}