"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface IBrand {
  id: number
  image: string | null
  updated_at: string
}

interface BrandsFormProps {
  brand: IBrand | null
  onSuccess: () => void
}

export function BrandsForm({ brand, onSuccess }: BrandsFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async () => {
    setError(null)

    if (!imageFile && !brand?.image) {
      setError("Please upload an image for the brand.")
      return
    }

    if (!imageFile) {
      onSuccess()
      return
    }

    setLoading(true)

    try {
      const ext = imageFile.name.split(".").pop()
      const path = `brand-logo-${Date.now()}.${ext}`

      // Always delete old image from storage
      if (brand?.image) {
        await supabase.storage
          .from("brands-images")
          .remove([brand.image])
      }

      const { error: uploadError } = await supabase.storage
        .from("brands-images")
        .upload(path, imageFile)

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from("brands")
        .update({ image: path, updated_at: new Date().toISOString() })
        .eq("id", 1)

      if (updateError) throw updateError

      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const currentImageUrl = brand?.image
    ? `${supabase.storage.from("brands-images").getPublicUrl(brand.image).data.publicUrl}?t=${new Date(brand.updated_at).getTime()}`
    : null

  const previewSrc = imagePreview ?? currentImageUrl

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-2">
        <Label>
          ბრენდის სურათი <span className="text-destructive">*</span>
        </Label>

        {previewSrc ? (
          <div className="relative w-full rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center p-6">
            <img
              src={previewSrc}
              alt="Brand preview"
              className="max-h-48 w-auto object-contain"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm border border-border rounded-full p-1 hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-4 hover:bg-muted/40 transition-colors">
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {imageFile
              ? imageFile.name
              : previewSrc
              ? "Click to replace image"
              : "Click to upload a brand image"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleSubmit} disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}