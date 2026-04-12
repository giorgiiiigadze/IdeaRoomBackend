"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Video } from "lucide-react"
import { toast } from "sonner"

type Video = {
  id: string
  project_id: string
  title: string
  description: string | null
  file_path: string
  status: "processing" | "ready" | "failed"
  created_at: string
}

const statusConfig: Record<
  Video["status"],
  { label: string; className: string; dotClass: string }
> = {
  ready: {
    label: "Ready",
    className: "text-green-600 border-green-300 bg-green-50 gap-1",
    dotClass: "bg-green-500",
  },
  processing: {
    label: "Processing",
    className: "text-yellow-600 border-yellow-300 bg-yellow-50 gap-1",
    dotClass: "bg-yellow-500",
  },
  failed: {
    label: "Failed",
    className: "text-red-600 border-red-300 bg-red-50 gap-1",
    dotClass: "bg-red-500",
  },
}

export function ProjectVideos({ projectId }: { projectId: string }) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchVideos = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (error) toast.error("Failed to load videos", { description: error.message })
    else setVideos(data ?? [])
  }, [projectId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (cancelled) return
      if (error) toast.error("Failed to load videos", { description: error.message })
      else setVideos(data ?? [])
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [projectId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()

    const filePath = `${projectId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from("projects-videos")
      .upload(filePath, file)

    if (uploadError) {
      toast.error("Upload failed", { description: uploadError.message })
      setUploading(false)
      return
    }

    const { error: insertError } = await supabase.from("videos").insert({
      project_id: projectId,
      title: file.name.replace(/\.[^/.]+$/, ""),
      file_path: filePath,
      status: "ready",
    })

    if (insertError) {
      toast.error("Failed to save video", { description: insertError.message })
    } else {
      toast.success("Video uploaded")
      fetchVideos()
    }

    setUploading(false)
    e.target.value = ""
  }

  async function handleDelete(video: Video) {
    const supabase = createClient()

    const { error: storageError } = await supabase.storage
      .from("projects-videos")
      .remove([video.file_path])

    if (storageError) {
      toast.error("Failed to delete file", { description: storageError.message })
      return
    }

    const { error: dbError } = await supabase
      .from("videos")
      .delete()
      .eq("id", video.id)

    if (dbError) {
      toast.error("Failed to delete video", { description: dbError.message })
    } else {
      toast.success("Video deleted")
      fetchVideos()
    }
  }

  function getPublicUrl(filePath: string) {
    const supabase = createClient()
    const { data } = supabase.storage
      .from("projects-videos")
      .getPublicUrl(filePath)
    return data.publicUrl
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Videos</p>
        <label>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button size="sm" variant="outline" asChild disabled={uploading}>
            <span className="cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : "Upload Video"}
            </span>
          </Button>
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
          <Video className="h-8 w-8 opacity-30" />
          <p className="text-sm">No videos yet</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-md border overflow-hidden">
          {videos.map((video) => {
            const config = statusConfig[video.status]
            return (
              <div
                key={video.id}
                className="flex items-center gap-4 px-4 py-3 bg-background hover:bg-muted/40 transition-colors"
              >
                <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-muted">
                  {video.status === "ready" ? (
                    <video
                      src={getPublicUrl(video.file_path)}
                      className="h-10 w-16 rounded object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{video.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(video.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <Badge variant="outline" className={config.className}>
                  <span className={`size-1.5 rounded-full inline-block ${config.dotClass}`} />
                  {config.label}
                </Badge>

                <div className="flex items-center gap-2 shrink-0">
                  {video.status === "ready" && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={getPublicUrl(video.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Play
                      </a>
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(video)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}