import { createUser } from "@/lib/actions/users"
import { useState } from "react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { toast } from "sonner"

export default function AdminForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: "", password: "" })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await createUser(form.email, form.password)

    setLoading(false)

    if (res.error) {
      setError(res.error)
      toast.error("Failed to create admin", { description: res.error })
      return
    }

    toast.success("Admin created", {
      description: `${form.email} was added successfully.`,
    })

    setTimeout(() => onSuccess(), 100)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="admin@example.com"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Admin"}
      </Button>
    </form>
  )
}