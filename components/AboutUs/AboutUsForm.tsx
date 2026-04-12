"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface IAboutUs {
  id: number
  description: string
  video_url: string
}

interface AboutUsFormProps {
  data: IAboutUs | null
  onSuccess: () => void
}

export function AboutUsForm({ data, onSuccess }: AboutUsFormProps) {
  const [description, setDescription] = useState(data?.description ?? "")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setDescription(data?.description ?? "")
  }, [data])

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      let video_url = data?.video_url ?? ""

      if (videoFile) {
        const ext = videoFile.name.split(".").pop()
        const path = `videos/academy-about-us.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("about-images")
          .upload(path, videoFile, { upsert: true })

        if (uploadError) throw uploadError
        video_url = path
      }

      const { error: upsertError } = await supabase
        .from("about_us")
        .upsert(
          { id: data?.id ?? 1, description, video_url },
          { onConflict: "id" }
        )

      if (upsertError) throw upsertError

      onSuccess()
    }  catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Something went wrong.")
      }
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 py-2">

      <div className="flex flex-col gap-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write a short description of the academy..."
          rows={5}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Main Video</Label>
        {data?.video_url && !videoFile && (
          <p className="text-xs text-muted-foreground">
            Current: <span className="font-medium">{data.video_url.split("/").pop()}</span>
          </p>
        )}
        {videoPreview && (
          <div className="rounded-lg overflow-hidden aspect-video w-full bg-black">
            <video src={videoPreview} controls className="w-full h-full object-cover" />
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-4 hover:bg-muted/40 transition-colors">
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {videoFile ? videoFile.name : "Click to upload a new video"}
          </span>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoChange}
          />
        </label>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button onClick={handleSubmit} disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {loading ? "Saving..." : "Save Changes"}
      </Button>

    </div>
  )
}