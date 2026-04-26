"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SheetPanel } from "@/components/Sheet/Sheet"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { BrandsForm } from "@/components/Brands/BrandsForm"

// Created once at module level — stable across renders, no ref needed
const supabase = createClient()

interface IBrand {
  id: number
  image: string | null
  updated_at: string
}

export default function BrandsPage() {
  const [brand, setBrand] = useState<IBrand | null>(null)
  const [imagePublicUrl, setImagePublicUrl] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Wrapped in useCallback so it's stable and safe to list as a useEffect dep
  const resolveUrl = useCallback((image: string, updatedAt: string) => {
    const { data } = supabase.storage.from("brands-images").getPublicUrl(image)
    return data?.publicUrl
      ? `${data.publicUrl}?t=${new Date(updatedAt).getTime()}`
      : null
  }, [])

  const fetchBrand = useCallback(async () => {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .maybeSingle()

    if (error) {
      toast.error("Failed to load brand", { description: error.message })
      return
    }

    if (data) {
      setBrand(data)
      setImagePublicUrl(data.image ? resolveUrl(data.image, data.updated_at) : null)
    }
  }, [resolveUrl])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .maybeSingle()

      if (cancelled) return

      if (error) {
        toast.error("Failed to load brand", { description: error.message })
        return
      }

      if (data) {
        setBrand(data)
        setImagePublicUrl(data.image ? resolveUrl(data.image, data.updated_at) : null)
      }
    }

    load()
    return () => { cancelled = true }
  }, [resolveUrl])

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">ბრენდი</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <Pencil />
          დააედითე
        </Button>
      </div>

      <Card className="rounded-xl bg-sidebar p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-muted-foreground">ბრენდის სურათი</p>

        {imagePublicUrl ? (
          <div className="rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center p-6">
            <img
              src={imagePublicUrl}
              alt="Brand"
              className="max-h-64 w-auto object-contain"
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted flex items-center justify-center h-48">
            <p className="text-sm text-muted-foreground">სურათი არ არის.</p>
          </div>
        )}

        {brand?.updated_at && (
          <p className="text-xs text-muted-foreground">
            განახლდა:{" "}
            <span className="font-medium">
              {new Date(brand.updated_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </p>
        )}
      </Card>

      <SheetPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="დააედითე ბრენდი"
        description="შეცვალე ბრენდის სურათი."
        side="right"
        className="w-125 sm:max-w-125 p-4"
      >
        <BrandsForm
          brand={brand}
          onSuccess={() => {
            setSheetOpen(false)
            fetchBrand()
          }}
        />
      </SheetPanel>
    </div>
  )
}