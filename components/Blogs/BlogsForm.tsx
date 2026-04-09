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

interface BlogFormProps {
  onSuccess: () => void
}

export function BlogForm({ onSuccess }: BlogFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    author: "",
    is_published: false,
  })

  const uploadProps = useSupabaseUpload({
    bucketName: 'blog-images',
    path: 'cover-images',
    allowedMimeTypes: ['image/*'],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target

    if (name === "title") {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      setForm((prev) => ({ ...prev, title: value, slug }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let cover_image_url: string | null = null

      if (uploadProps.files.length > 0) {
        await uploadProps.onUpload()

        const supabase = createClient()
        const file = uploadProps.files[0]
        const filePath = `cover-images/${file.name}`

        const { data } = supabase.storage
          .from('blog-images')
          .getPublicUrl(filePath)

        cover_image_url = data.publicUrl
      }

      const supabase = createClient()
      const { error } = await supabase.from("blogs").insert({
        title: form.title,
        slug: form.slug,
        content: form.content,
        author: form.author || null,
        cover_image_url,
        is_published: form.is_published,
        published_at: form.is_published ? new Date().toISOString() : null,
      })

      if (error) {
        setError(error.message)
        toast.error("Failed to create blog post", { description: error.message })
        return
      }

      toast.success("Blog post created", {
        description: `"${form.title}" was created successfully.`,
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
          placeholder="My Blog Post"
          value={form.title}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
        <Input
          id="slug"
          name="slug"
          placeholder="my-blog-post"
          value={form.slug}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="author">Author</Label>
        <Input
          id="author"
          name="author"
          placeholder="Jane Smith"
          value={form.author}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Full article content goes here..."
          value={form.content}
          onChange={handleChange}
          rows={8}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Cover Image</Label>
        <Dropzone {...uploadProps}>
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_published">Publish immediately</Label>
        <Switch
          id="is_published"
          checked={form.is_published}
          onCheckedChange={(val) => setForm((prev) => ({ ...prev, is_published: val }))}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Create Blog Post"}
      </Button>
    </form>
  )
}