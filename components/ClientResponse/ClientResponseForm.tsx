"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"

type ClientResponse = {
  id: string
  name: string
  role: string | null
  quote: string
  avatar_url: string | null
  is_active: boolean
}

interface ClientResponseFormProps {
  onSuccess: () => void
  editData?: ClientResponse | null
}

export function ClientResponseForm({ onSuccess, editData }: ClientResponseFormProps) {
  const isEditing = !!editData

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: editData?.name ?? "",
    role: editData?.role ?? "",
    quote: editData?.quote ?? "",
    is_active: editData?.is_active ?? true,
  })

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name,
        role: editData.role ?? "",
        quote: editData.quote,
        is_active: editData.is_active,
      })
    }
  }, [editData])

  const uploadProps = useSupabaseUpload({
    bucketName: 'testimonials-images',
    path: 'client-response-images',
    allowedMimeTypes: ['image/*'],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      let avatar_url: string | null = editData?.avatar_url ?? null

      if (uploadProps.files.length > 0) {
        await uploadProps.onUpload()
        const file = uploadProps.files[0]
        const { data } = supabase.storage
          .from('testimonials-images')
          .getPublicUrl(`client-response-images/${file.name}`)
        avatar_url = data.publicUrl
      }

      if (isEditing) {
        const { error } = await supabase
          .from("testimonials")
          .update({
            name: form.name,
            role: form.role || null,
            quote: form.quote,
            avatar_url,
            is_active: form.is_active,
          })
          .eq("id", editData.id)

        if (error) {
          setError(error.message)
          toast.error("Failed to update testimonial", { description: error.message })
          return
        }

        toast.success("Testimonial updated", {
          description: `"${form.name}" was updated successfully.`,
        })
      } else {
        const { error } = await supabase.from("testimonials").insert({
          name: form.name,
          role: form.role || null,
          quote: form.quote,
          avatar_url,
          is_active: form.is_active,
        })

        if (error) {
          setError(error.message)
          toast.error("Failed to add testimonial", { description: error.message })
          return
        }

        toast.success("Testimonial added", {
          description: `"${form.name}" was added successfully.`,
        })
      }

      setTimeout(() => onSuccess(), 100)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        setError(message)
        toast.error("Something went wrong", { description: message })
      } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          name="role"
          placeholder="CEO, Startup Georgia"
          value={form.role}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="quote">Quote <span className="text-destructive">*</span></Label>
        <Textarea
          id="quote"
          name="quote"
          placeholder="The clients quote..."
          value={form.quote}
          onChange={handleChange}
          rows={4}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Avatar Image
          {isEditing && editData?.avatar_url && (
            <span className="text-xs text-muted-foreground font-normal ml-2">
              (upload a new one to replace)
            </span>
          )}
        </Label>
        {isEditing && editData?.avatar_url && uploadProps.files.length === 0 && (
          <img
            src={editData.avatar_url}
            alt="Current avatar"
            className="w-16 h-16 rounded-full object-cover"
          />
        )}
        <Dropzone {...uploadProps}>
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
        {loading ? "Saving..." : isEditing ? "Update Testimonial" : "Add Testimonial"}
      </Button>
    </form>
  )
}