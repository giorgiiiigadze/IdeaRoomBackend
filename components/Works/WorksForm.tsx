"use client"

import { useState, useEffect } from "react"
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

type Work = {
  id: string
  slug: string
  title: string
  title_ka: string | null
  category: string
  category_ka: string | null
  image: string
  description: string | null
  description_ka: string | null
  client: string | null
  published: boolean
  created_at: string
  updated_at: string
}

interface WorkFormProps {
  work?: Work | null
  onSuccess: () => void
}

type LangForm = {
  title: string
  category: string
  description: string
}

function isLangFormFilled(f: LangForm) {
  return f.title.trim() !== "" && f.category.trim() !== ""
}

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function WorkForm({ work, onSuccess }: WorkFormProps) {
  const isEditing = !!work
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"en" | "ka">("en")

  const [formEn, setFormEn] = useState<LangForm>({
    title: work?.title ?? "",
    category: work?.category ?? "",
    description: work?.description ?? "",
  })

  const [formKa, setFormKa] = useState<LangForm>({
    title: work?.title_ka ?? "",
    category: work?.category_ka ?? "",
    description: work?.description_ka ?? "",
  })

  const [customSlug, setCustomSlug] = useState(work?.slug ?? "")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [client, setClient] = useState(work?.client ?? "")
  const [published, setPublished] = useState<boolean>(
    isEditing ? Boolean(work?.published) : true
  )

  useEffect(() => {
    if (work) {
      setFormEn({
        title: work.title,
        category: work.category,
        description: work.description ?? "",
      })
      setFormKa({
        title: work.title_ka ?? "",
        category: work.category_ka ?? "",
        description: work.description_ka ?? "",
      })
      setCustomSlug(work.slug)
      setClient(work.client ?? "")
      setPublished(Boolean(work.published))
      setSlugManuallyEdited(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [work?.id])

  const slug = slugManuallyEdited ? customSlug : generateSlug(formEn.title)

  const enFilled = isLangFormFilled(formEn)
  const kaFilled = isLangFormFilled(formKa)
  const bothFilled = enFilled && kaFilled

  const uploadProps = useSupabaseUpload({
    bucketName: "works-images",
    path: "work-images",
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
      setError("Please fill in the English title and category.")
      return
    }
    if (!kaFilled) {
      setActiveTab("ka")
      setError("Please fill in the Georgian title and category.")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      let image: string = work?.image ?? ""

      if (uploadProps.files.length > 0) {
        await uploadProps.onUpload()
        const file = uploadProps.files[0]
        const filePath = `work-images/${file.name}`
        const { data } = supabase.storage.from("works-images").getPublicUrl(filePath)
        image = data.publicUrl
      }

      const payload = {
        title: formEn.title.trim(),
        title_ka: formKa.title.trim(),
        slug: slug.trim(),
        category: formEn.category.trim(),
        category_ka: formKa.category.trim(),
        description: formEn.description.trim() || null,
        description_ka: formKa.description.trim() || null,
        client: client.trim() || null,
        image,
        published,
      }

      if (isEditing) {
        const { error } = await supabase
          .from("works")
          .update(payload)
          .eq("id", work.id)

        if (error) {
          setError(error.message)
          toast.error("Failed to update work", { description: error.message })
          return
        }

        toast.success("Work updated", {
          description: `"${payload.title}" was updated successfully.`,
        })
      } else {
        const { error } = await supabase.from("works").insert(payload)

        if (error) {
          setError(error.message)
          toast.error("Failed to create work", { description: error.message })
          return
        }

        toast.success("Work created", {
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
              placeholder="Work title"
              value={formEn.title}
              onChange={handleChangeEn}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="en-category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Input
              id="en-category"
              name="category"
              placeholder="Work category"
              value={formEn.category}
              onChange={handleChangeEn}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="en-description">Description</Label>
            <Textarea
              id="en-description"
              name="description"
              placeholder="Short description of the work..."
              value={formEn.description}
              onChange={handleChangeEn}
              rows={4}
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
              placeholder="სამუშაოს სათაური"
              value={formKa.title}
              onChange={handleChangeKa}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ka-category">
              კატეგორია <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ka-category"
              name="category"
              placeholder="სამუშაოს კატეგორია"
              value={formKa.category}
              onChange={handleChangeKa}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ka-description">აღწერა</Label>
            <Textarea
              id="ka-description"
              name="description"
              placeholder="სამუშაოს მოკლე აღწერა..."
              value={formKa.description}
              onChange={handleChangeKa}
              rows={4}
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
          placeholder="Title slug (auto generated)"
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
        <Label htmlFor="client">Client</Label>
        <Input
          id="client"
          placeholder="Client for work"
          value={client}
          onChange={(e) => setClient(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Image</Label>
        {isEditing && work.image && uploadProps.files.length === 0 && (
          <img
            src={work.image}
            alt="Current work image"
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
        <Label htmlFor="published">Publish immediately</Label>
        <Switch
          id="published"
          checked={published}
          onCheckedChange={setPublished}
        />
      </div>

      {!bothFilled && (
        <p className="text-xs text-muted-foreground">
          Both English and Georgian versions must be filled before saving.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading || !bothFilled}>
        {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Work"}
      </Button>
    </form>
  )
}