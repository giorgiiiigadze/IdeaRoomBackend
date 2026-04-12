"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"

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

interface BlogFormProps {
  blog?: Blog | null
  onSuccess: () => void
}

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function BlogForm({ blog, onSuccess }: BlogFormProps) {
  const isEditing = !!blog
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(blog?.title ?? "")
  const [customSlug, setCustomSlug] = useState(blog?.slug ?? "")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [author, setAuthor] = useState(blog?.author ?? "")
  const [content, setContent] = useState(blog?.content ?? "")
  const [isPublished, setIsPublished] = useState(blog?.is_published ?? true)

  const slug = slugManuallyEdited ? customSlug : generateSlug(title)

  const uploadProps = useSupabaseUpload({
    bucketName: "blog-images",
    path: "cover-images",
    allowedMimeTypes: ["image/*"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      let cover_image_url: string | null = blog?.cover_image_url ?? null

      if (uploadProps.files.length > 0) {
        await uploadProps.onUpload()

        const file = uploadProps.files[0]
        const filePath = `cover-images/${file.name}`
        const { data } = supabase.storage.from("blog-images").getPublicUrl(filePath)
        cover_image_url = data.publicUrl
      }

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        content: content.trim(),
        author: author.trim() || null,
        cover_image_url,
        is_published: isPublished,
        published_at: isPublished
          ? (blog?.published_at ?? new Date().toISOString())
          : null,
      }

      if (isEditing) {
        const { error } = await supabase
          .from("blogs")
          .update(payload)
          .eq("id", blog.id)

        if (error) {
          setError(error.message)
          toast.error("Failed to update blog post", { description: error.message })
          return
        }

        toast.success("Blog post updated", {
          description: `"${payload.title}" was updated successfully.`,
        })
      } else {
        const { error } = await supabase.from("blogs").insert(payload)

        if (error) {
          setError(error.message)
          toast.error("Failed to create blog post", { description: error.message })
          return
        }

        toast.success("Blog post created", {
          description: `"${payload.title}" was created successfully.`,
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
        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
        <Input
          id="title"
          name="title"
          placeholder="My Blog Post"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
        <Input
          id="slug"
          name="slug"
          placeholder="my-blog-post"
          value={slug}
          onChange={(e) => {
            setCustomSlug(e.target.value)
            setSlugManuallyEdited(true)
          }}
          onBlur={(e) => setCustomSlug(generateSlug(e.target.value))}
          required
        />
        <p className="text-xs text-muted-foreground">
          Auto-generated from title. You can override it manually.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="author">Author</Label>
        <Input
          id="author"
          name="author"
          placeholder="Jane Smith"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Full article content goes here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Cover Image</Label>
        {isEditing && blog.cover_image_url && uploadProps.files.length === 0 && (
          <img
            src={blog.cover_image_url}
            alt="Current cover"
            className="h-32 w-full rounded-md object-cover mb-1"
          />
        )}
        <Dropzone {...uploadProps}>
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
        {isEditing && (
          <p className="text-xs text-muted-foreground">
            Upload a new image to replace the current one, or leave empty to keep it.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_published">Publish immediately</Label>
        <Switch
          id="is_published"
          checked={isPublished}
          onCheckedChange={setIsPublished}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Blog Post"}
      </Button>
    </form>
  )
}