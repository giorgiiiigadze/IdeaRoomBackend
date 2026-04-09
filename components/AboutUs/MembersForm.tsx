"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"

interface MembersFormProps {
  onSuccess: () => void
}

export function MembersForm({ onSuccess }: MembersFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dropzoneKey, setDropzoneKey] = useState(0)
  const [form, setForm] = useState({
    name: "",
    role: "",
  })

  const uploadProps = useSupabaseUpload({
    bucketName: "member-images",
    path: "avatars",
    allowedMimeTypes: ["image/*"],
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let image_url: string | null = null

      if (uploadProps.files.length > 0) {
        await uploadProps.onUpload()
        const file = uploadProps.files[0]
        const filePath = `avatars/${file.name}`

        const { data: urlData } = createClient()
          .storage
          .from("member-images")
          .getPublicUrl(filePath)

        image_url = urlData?.publicUrl ?? null
      }

      const { error } = await createClient()
        .from("members")
        .insert({
          name: form.name,
          role: form.role,
          image_url,
        })

      if (error) {
        setError(error.message)
        toast.error("Failed to add member", { description: error.message })
        return
      }

      toast.success("Member added", {
        description: `"${form.name}" was added successfully.`,
      })

      setForm({ name: "", role: "" })
      setDropzoneKey((prev) => prev + 1)

      onSuccess()
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
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="John Doe"
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
          placeholder="Instructor / Designer"
          value={form.role}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Avatar Image</Label>
        <Dropzone key={dropzoneKey} {...uploadProps}>
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Add Member"}
      </Button>
    </form>
  )
}