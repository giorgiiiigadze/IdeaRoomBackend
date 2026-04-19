"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Check } from "lucide-react"

import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"

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

interface BlogFormProps {
  blog?: Blog | null
  onSuccess: () => void
}

type LangForm = {
  title: string
  content: string
}

function isLangFormFilled(f: LangForm) {
  return f.title.trim() !== "" && f.content.trim() !== ""
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
  const [activeTab, setActiveTab] = useState<"en" | "ka">("en")

  const [formEn, setFormEn] = useState<LangForm>({
    title: blog?.title ?? "",
    content: blog?.content ?? "",
  })

  const [formKa, setFormKa] = useState<LangForm>({
    title: blog?.title_ka ?? "",
    content: blog?.content_ka ?? "",
  })

  const [customSlug, setCustomSlug] = useState(blog?.slug ?? "")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [author, setAuthor] = useState(blog?.author ?? "")
  const [isPublished, setIsPublished] = useState(blog?.is_published ?? true)

  const slug = slugManuallyEdited ? customSlug : generateSlug(formEn.title)

  const enFilled = isLangFormFilled(formEn)
  const kaFilled = isLangFormFilled(formKa)
  const bothFilled = enFilled && kaFilled

  const uploadProps = useSupabaseUpload({
    bucketName: "blog-images",
    path: "cover-images",
    allowedMimeTypes: ["image/*"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10,
  })

  function handleChangeEn(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFormEn((prev) => ({ ...prev, [name]: value }))

    if (name === "title" && !slugManuallyEdited) {
      setCustomSlug(generateSlug(value))
    }
  }

  function handleChangeKa(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormKa((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!enFilled) {
      setActiveTab("en")
      setError("Please fill in the English title and content.")
      return
    }
    if (!kaFilled) {
      setActiveTab("ka")
      setError("Please fill in the Georgian title and content.")
      return
    }

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
        title: formEn.title.trim(),
        title_ka: formKa.title.trim(),
        slug: slug.trim(),
        content: formEn.content.trim(),
        content_ka: formKa.content.trim(),
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
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "en" | "ka")}
      >
        <TabsList className="w-full">
          <TabsTrigger value="en" className="flex-1 gap-2">
            English
            {enFilled ? (
              <Badge
                variant="secondary"
                className="text-green-600 border-green-300 bg-green-50 text-xs px-1.5 py-0"
              >
                <Check className="size-3" />
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-muted-foreground text-xs px-1.5 py-0"
              >
                Required
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ka" className="flex-1 gap-2">
            Georgian
            {kaFilled ? (
              <Badge
                variant="secondary"
                className="text-green-600 border-green-300 bg-green-50 text-xs px-1.5 py-0"
              >
                <Check className="size-3" />
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-muted-foreground text-xs px-1.5 py-0"
              >
                Required
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="en" className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="en-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="en-title"
              name="title"
              placeholder="My Blog Post"
              value={formEn.title}
              onChange={handleChangeEn}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="en-content">
              Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="en-content"
              name="content"
              placeholder="Full article content goes here..."
              value={formEn.content}
              onChange={handleChangeEn}
              rows={8}
            />
          </div>
        </TabsContent>

        <TabsContent value="ka" className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ka-title">
              სათაური <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ka-title"
              name="title"
              placeholder="ბლოგის სათაური"
              value={formKa.title}
              onChange={handleChangeKa}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ka-content">
              კონტენტი <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ka-content"
              name="content"
              placeholder="სტატიის სრული კონტენტი..."
              value={formKa.content}
              onChange={handleChangeKa}
              rows={8}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">
          Slug <span className="text-destructive">*</span>
        </Label>
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
          Auto-generated from English title. You can override it manually.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="author">Author</Label>
        <Input
          id="author"
          name="author"
          placeholder="Author here"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
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

      {!bothFilled && (
        <p className="text-xs text-muted-foreground">
          Both English and Georgian versions must be filled before saving.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading || !bothFilled}>
        {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Blog Post"}
      </Button>
    </form>
  )
}