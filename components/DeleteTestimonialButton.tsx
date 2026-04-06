"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteTestimonial } from "@/lib/actions/client-responses"

type DeleteButtonProps = {
  id: string
  onDeleted?: () => void
}

export function DeleteTestimonialButton({ id, onDeleted }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this?")
    if (!confirmed) return

    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("id", id)

      const res = await deleteTestimonial(formData)

      if (res?.error) {
        setError(res.error)
      } else {
        onDeleted?.()
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={loading}
      >
        <Trash2 className="size-4 mr-1" />
        {loading ? "Deleting..." : "Delete"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}