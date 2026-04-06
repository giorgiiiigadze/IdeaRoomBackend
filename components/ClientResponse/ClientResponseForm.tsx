"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface ClientResponseFormProps {
  onSuccess: () => void
}

export function ClientResponseForm({ onSuccess }: ClientResponseFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    role: "",
    quote: "",
    avatar_url: "",
    is_active: true,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from("testimonials").insert({
      name: form.name,
      role: form.role || null,
      quote: form.quote,
      avatar_url: form.avatar_url || null,
      is_active: form.is_active,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    onSuccess()
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
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input
          id="avatar_url"
          name="avatar_url"
          placeholder="https://..."
          value={form.avatar_url}
          onChange={handleChange}
        />
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
        {loading ? "Saving..." : "Add Testimonial"}
      </Button>
    </form>
  )
}