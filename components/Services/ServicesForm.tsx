"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"
import { Check } from "lucide-react"

type Service = {
  id: string
  title: string
  title_ka: string | null
  description: string
  description_ka: string | null
  slug: string
  image: string | null
  icon: string | null
  is_active: boolean
}

interface ServiceFormProps {
  onSuccess: () => void
  editData?: Service | null
}

type LangForm = {
  title: string
  description: string
}

function isLangFormFilled(f: LangForm) {
  return f.title.trim() !== "" && f.description.trim() !== ""
}

export function ServiceForm({ onSuccess, editData }: ServiceFormProps) {
  const isEditing = !!editData
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"en" | "ka">("en")

  const [formEn, setFormEn] = useState<LangForm>({
    title: editData?.title ?? "",
    description: editData?.description ?? "",
  })

  const [formKa, setFormKa] = useState<LangForm>({
    title: editData?.title_ka ?? "",
    description: editData?.description_ka ?? "",
  })

  const [slug, setSlug] = useState(editData?.slug ?? "")
  const [isActive, setIsActive] = useState(editData?.is_active ?? true)

  useEffect(() => {
    if (editData) {
      setFormEn({ title: editData.title, description: editData.description })
      setFormKa({
        title: editData.title_ka ?? "",
        description: editData.description_ka ?? "",
      })
      setSlug(editData.slug)
      setIsActive(editData.is_active)
    }
  }, [editData])

  const imageUploadProps = useSupabaseUpload({
    bucketName: "services-images",
    path: "service-images",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10,
  })

  const iconUploadProps = useSupabaseUpload({
    bucketName: "services-images",
    path: "service-icons",
    allowedMimeTypes: ["image/svg+xml"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10,
  })

  function handleChangeEn(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFormEn((prev) => ({ ...prev, [name]: value }))

    if (name === "title") {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
      )
    }
  }

  function handleChangeKa(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormKa((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const enFilled = isLangFormFilled(formEn)
  const kaFilled = isLangFormFilled(formKa)
  const bothFilled = enFilled && kaFilled

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!enFilled) {
      setActiveTab("en")
      setError("Please fill in the English title and description.")
      return
    }
    if (!kaFilled) {
      setActiveTab("ka")
      setError("Please fill in the Georgian title and description.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      let image: string | null = editData?.image ?? null
      let icon: string | null = editData?.icon ?? null

      if (imageUploadProps.files.length > 0) {
        await imageUploadProps.onUpload()
        const file = imageUploadProps.files[0]
        const { data } = supabase.storage
          .from("services-images")
          .getPublicUrl(`service-images/${file.name}`)
        image = data.publicUrl
      }

      if (iconUploadProps.files.length > 0) {
        await iconUploadProps.onUpload()
        const file = iconUploadProps.files[0]
        const { data } = supabase.storage
          .from("services-images")
          .getPublicUrl(`service-icons/${file.name}`)
        icon = data.publicUrl
      }

      const payload = {
        title: formEn.title,
        description: formEn.description,
        title_ka: formKa.title,
        description_ka: formKa.description,
        slug,
        image,
        icon,
        is_active: isActive,
      }

      if (isEditing) {
        const { error } = await supabase
          .from("services")
          .update(payload)
          .eq("id", editData.id)

        if (error) {
          setError(error.message)
          toast.error("Failed to update service", { description: error.message })
          return
        }

        toast.success("Service updated", {
          description: `"${formEn.title}" was updated successfully.`,
        })
      } else {
        const { error } = await supabase.from("services").insert(payload)

        if (error) {
          setError(error.message)
          toast.error("Failed to add service", { description: error.message })
          return
        }

        toast.success("Service added", {
          description: `"${formEn.title}" was added successfully.`,
        })
      }

      setTimeout(() => onSuccess(), 100)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong"
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
                <Check />
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
                <Check />
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
              placeholder="Service title"
              value={formEn.title}
              onChange={handleChangeEn}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="en-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="en-description"
              name="description"
              placeholder="Describe this service..."
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
              placeholder="სერვისის სახელი"
              value={formKa.title}
              onChange={handleChangeKa}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ka-description">
              აღწერა <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ka-description"
              name="description"
              placeholder="აღწერეთ სერვისი..."
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
          name="slug"
          placeholder="Title slug (auto generated)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Icon{" "}
          <span className="text-muted-foreground text-xs font-normal">
            (SVG only)
          </span>
          {isEditing && editData?.icon && (
            <span className="text-muted-foreground text-xs font-normal ml-1">
              (upload to replace)
            </span>
          )}
        </Label>
        {isEditing && editData?.icon && iconUploadProps.files.length === 0 && (
          <Image
            src={editData.icon}
            alt="Current icon"
            width={40}
            height={40}
            className="object-contain"
          />
        )}
        <Dropzone {...iconUploadProps}>
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Service Image
          {isEditing && editData?.image && (
            <span className="text-muted-foreground text-xs font-normal ml-1">
              (upload to replace)
            </span>
          )}
        </Label>
        {isEditing &&
          editData?.image &&
          imageUploadProps.files.length === 0 && (
            <Image
              src={editData.image}
              alt="Current image"
              width={800}
              height={400}
              className="rounded-lg object-cover w-full"
            />
          )}
        <Dropzone {...imageUploadProps}>
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Active</Label>
        <Switch
          id="is_active"
          checked={isActive}
          onCheckedChange={(val) => setIsActive(val)}
        />
      </div>

      {!bothFilled && (
        <p className="text-xs text-muted-foreground">
          Both English and Georgian versions must be filled before saving.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading || !bothFilled}>
        {loading ? "Saving..." : isEditing ? "Update Service" : "Add Service"}
      </Button>
    </form>
  )
}