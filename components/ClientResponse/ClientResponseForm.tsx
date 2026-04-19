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
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"
import { Check } from "lucide-react"

type ClientResponse = {
  id: string
  name: string
  role: string | null
  quote: string
  name_ka: string | null
  role_ka: string | null
  quote_ka: string | null
  avatar_url: string | null
  is_active: boolean
}

interface ClientResponseFormProps {
  onSuccess: () => void
  editData?: ClientResponse | null
}

type LangForm = {
  name: string
  role: string
  quote: string
}

function isLangFormFilled(f: LangForm) {
  return f.name.trim() !== "" && f.quote.trim() !== ""
}

export function ClientResponseForm({ onSuccess, editData }: ClientResponseFormProps) {
  const isEditing = !!editData
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"en" | "ka">("en")

  const [formEn, setFormEn] = useState<LangForm>({
    name: editData?.name ?? "",
    role: editData?.role ?? "",
    quote: editData?.quote ?? "",
  })

  const [formKa, setFormKa] = useState<LangForm>({
    name: editData?.name_ka ?? "",
    role: editData?.role_ka ?? "",
    quote: editData?.quote_ka ?? "",
  })

  const [isActive, setIsActive] = useState(editData?.is_active ?? true)

  useEffect(() => {
    if (editData) {
      setFormEn({ name: editData.name, role: editData.role ?? "", quote: editData.quote })
      setFormKa({ name: editData.name_ka ?? "", role: editData.role_ka ?? "", quote: editData.quote_ka ?? "" })
      setIsActive(editData.is_active)
    }
  }, [editData])

  const uploadProps = useSupabaseUpload({
    bucketName: "testimonials-images",
    path: "client-response-images",
    allowedMimeTypes: ["image/*"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10,
  })

  function handleChangeEn(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormEn((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleChangeKa(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
      setError("Please fill in the English name and quote.")
      return
    }
    if (!kaFilled) {
      setActiveTab("ka")
      setError("Please fill in the Georgian name and quote.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      let avatar_url: string | null = editData?.avatar_url ?? null

      if (uploadProps.files.length > 0) {
        await uploadProps.onUpload()
        const file = uploadProps.files[0]
        const { data } = supabase.storage
          .from("testimonials-images")
          .getPublicUrl(`client-response-images/${file.name}`)
        avatar_url = data.publicUrl
      }

      const payload = {
        name: formEn.name,
        role: formEn.role || null,
        quote: formEn.quote,
        name_ka: formKa.name,
        role_ka: formKa.role || null,
        quote_ka: formKa.quote,
        avatar_url,
        is_active: isActive,
      }

      if (isEditing) {
        const { error } = await supabase.from("testimonials").update(payload).eq("id", editData.id)
        if (error) {
          setError(error.message)
          toast.error("Failed to update testimonial", { description: error.message })
          return
        }
        toast.success("Testimonial updated", { description: `"${formEn.name}" was updated successfully.` })
      } else {
        const { error } = await supabase.from("testimonials").insert(payload)
        if (error) {
          setError(error.message)
          toast.error("Failed to add testimonial", { description: error.message })
          return
        }
        toast.success("Testimonial added", { description: `"${formEn.name}" was added successfully.` })
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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "en" | "ka")}>
        <TabsList className="w-full">
          <TabsTrigger value="en" className="flex-1 gap-2">
            English
            {enFilled ? (
              <Badge variant="secondary" className="text-green-600 border-green-300 bg-green-50 text-xs px-1.5 py-0">
                <Check />
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
                <Check />
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-muted-foreground text-xs px-1.5 py-0">
                Required
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="en" className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="en-name">Name <span className="text-destructive">*</span></Label>
            <Input
              id="en-name"
              name="name"
              placeholder="Client name"
              value={formEn.name}
              onChange={handleChangeEn}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="en-role">Role</Label>
            <Input
              id="en-role"
              name="role"
              placeholder="Role of the client"
              value={formEn.role}
              onChange={handleChangeEn}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="en-quote">Quote <span className="text-destructive">*</span></Label>
            <Textarea
              id="en-quote"
              name="quote"
              placeholder="The client's quote..."
              value={formEn.quote}
              onChange={handleChangeEn}
              rows={4}
            />
          </div>
        </TabsContent>

        <TabsContent value="ka" className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ka-name">სახელი <span className="text-destructive">*</span></Label>
            <Input
              id="ka-name"
              name="name"
              placeholder="კლიენტის სახელი"
              value={formKa.name}
              onChange={handleChangeKa}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ka-role">როლი</Label>
            <Input
              id="ka-role"
              name="role"
              placeholder="კლიენტის როლი"
              value={formKa.role}
              onChange={handleChangeKa}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ka-quote">ციტატა <span className="text-destructive">*</span></Label>
            <Textarea
              id="ka-quote"
              name="quote"
              placeholder="კლიენტის ციტატა..."
              value={formKa.quote}
              onChange={handleChangeKa}
              rows={4}
            />
          </div>
        </TabsContent>
      </Tabs>

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
        {loading ? "Saving..." : isEditing ? "Update Testimonial" : "Add Testimonial"}
      </Button>
    </form>
  )
}
