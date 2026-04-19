"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface IAboutUs {
  id: number
  description: string
  description_ka: string | null
  video_url: string
}

interface AboutUsFormProps {
  data: IAboutUs | null
  onSuccess: () => void
}

type LangForm = {
  description: string
}

function isLangFormFilled(f: LangForm) {
  return f.description.trim() !== ""
}

export function AboutUsForm({ data, onSuccess }: AboutUsFormProps) {
  const [activeTab, setActiveTab] = useState<"en" | "ka">("en")

  const [formEn, setFormEn] = useState<LangForm>({
    description: data?.description ?? "",
  })

  const [formKa, setFormKa] = useState<LangForm>({
    description: data?.description_ka ?? "",
  })

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const enFilled = isLangFormFilled(formEn)
  const kaFilled = isLangFormFilled(formKa)
  const bothFilled = enFilled && kaFilled

  useEffect(() => {
    setFormEn({ description: data?.description ?? "" })
    setFormKa({ description: data?.description_ka ?? "" })
  }, [data])

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    setError(null)

    if (!enFilled) {
      setActiveTab("en")
      setError("Please fill in the English description.")
      return
    }
    if (!kaFilled) {
      setActiveTab("ka")
      setError("Please fill in the Georgian description.")
      return
    }

    setLoading(true)

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
          {
            id: data?.id ?? 1,
            description: formEn.description.trim(),
            description_ka: formKa.description.trim(),
            video_url,
          },
          { onConflict: "id" }
        )

      if (upsertError) throw upsertError

      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 py-2">
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
            <Label>
              აღწერა <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={formEn.description}
              onChange={(e) => setFormEn({ description: e.target.value })}
              placeholder="Write a short description of the academy..."
              rows={5}
            />
          </div>
        </TabsContent>

        <TabsContent value="ka" className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label>
              აღწერა <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={formKa.description}
              onChange={(e) => setFormKa({ description: e.target.value })}
              placeholder="აკადემიის მოკლე აღწერა..."
              rows={5}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-2">
        <Label>მთავარი ვიდეო</Label>
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

      {!bothFilled && (
        <p className="text-xs text-muted-foreground">
          Both English and Georgian descriptions must be filled before saving.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleSubmit} disabled={loading || !bothFilled}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}