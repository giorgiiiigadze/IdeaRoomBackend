"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"

interface Member {
  id: string
  name: string
  name_ka: string | null
  role: string
  role_ka: string | null
  image_url: string | null
}

interface MembersFormProps {
  member?: Member | null
  onSuccess: () => void
}

type LangForm = {
  name: string
  role: string
}

function isLangFormFilled(f: LangForm) {
  return f.name.trim() !== ""
}

export function MembersForm({ member, onSuccess }: MembersFormProps) {
  const isEditing = !!member
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dropzoneKey, setDropzoneKey] = useState(0)
  const [activeTab, setActiveTab] = useState<"en" | "ka">("en")

  const [formEn, setFormEn] = useState<LangForm>({
    name: member?.name ?? "",
    role: member?.role ?? "",
  })
  const [formKa, setFormKa] = useState<LangForm>({
    name: member?.name_ka ?? "",
    role: member?.role_ka ?? "",
  })

  useEffect(() => {
    setFormEn({ name: member?.name ?? "", role: member?.role ?? "" })
    setFormKa({ name: member?.name_ka ?? "", role: member?.role_ka ?? "" })
    setActiveTab("en")
    setError(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id])

  const enFilled = isLangFormFilled(formEn)
  const kaFilled = isLangFormFilled(formKa)
  const bothFilled = enFilled && kaFilled

  const uploadProps = useSupabaseUpload({
    bucketName: "member-images",
    path: "avatars",
    allowedMimeTypes: ["image/*"],
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024,
  })

  function handleChangeEn(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormEn((prev) => ({ ...prev, [name]: value }))
  }

  function handleChangeKa(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormKa((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!enFilled) {
      setActiveTab("en")
      setError("Please fill in the English name.")
      return
    }
    if (!kaFilled) {
      setActiveTab("ka")
      setError("Please fill in the Georgian name.")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      let image_url: string | null = member?.image_url ?? null

      if (uploadProps.files.length > 0) {
        await uploadProps.onUpload()
        const file = uploadProps.files[0]
        const filePath = `avatars/${file.name}`
        const { data: urlData } = supabase.storage
          .from("member-images")
          .getPublicUrl(filePath)
        image_url = urlData?.publicUrl ?? null
      }

      const payload = {
        name: formEn.name.trim(),
        role: formEn.role.trim() || null,
        name_ka: formKa.name.trim(),
        role_ka: formKa.role.trim() || null,
        image_url,
      }

      if (isEditing) {
        const { error } = await supabase
          .from("members")
          .update(payload)
          .eq("id", member.id)

        if (error) {
          setError(error.message)
          toast.error("Failed to update member", { description: error.message })
          return
        }

        toast.success("Member updated", {
          description: `"${payload.name}" was updated successfully.`,
        })
      } else {
        const { error } = await supabase.from("members").insert(payload)

        if (error) {
          setError(error.message)
          toast.error("Failed to add member", { description: error.message })
          return
        }

        toast.success("Member added", {
          description: `"${payload.name}" was added successfully.`,
        })

        setFormEn({ name: "", role: "" })
        setFormKa({ name: "", role: "" })
        setDropzoneKey((prev) => prev + 1)
      }

      onSuccess()
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="en-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="en-name"
              name="name"
              placeholder="John Doe"
              value={formEn.name}
              onChange={handleChangeEn}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="en-role">Role</Label>
            <Input
              id="en-role"
              name="role"
              placeholder="Instructor / Designer"
              value={formEn.role}
              onChange={handleChangeEn}
            />
          </div>
        </TabsContent>

        <TabsContent value="ka" className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ka-name">
              სახელი <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ka-name"
              name="name"
              placeholder="გიორგი გიორგაძე"
              value={formKa.name}
              onChange={handleChangeKa}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ka-role">როლი</Label>
            <Input
              id="ka-role"
              name="role"
              placeholder="ინსტრუქტორი / დიზაინერი"
              value={formKa.role}
              onChange={handleChangeKa}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-2">
        <Label>Avatar Image</Label>
        {isEditing && member.image_url && uploadProps.files.length === 0 && (
          <img
            src={member.image_url}
            alt={member.name}
            className="w-16 h-16 rounded-full object-cover mb-1"
          />
        )}
        <Dropzone key={dropzoneKey} {...uploadProps}>
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
        {isEditing && (
          <p className="text-xs text-muted-foreground">
            Upload a new image to replace the current one, or leave empty to keep it.
          </p>
        )}
      </div>

      {!bothFilled && (
        <p className="text-xs text-muted-foreground">
          Both English and Georgian names must be filled before saving.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading || !bothFilled}>
        {loading ? "Saving..." : isEditing ? "Save Changes" : "Add Member"}
      </Button>
    </form>
  )
}