"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SheetPanel } from "@/components/Sheet/Sheet"
import { Card } from "@/components/ui/card"
import { AboutUsForm } from "@/components/AboutUs/AboutUsForm"
import { MembersForm } from "@/components/AboutUs/MembersForm"
import { DataTable } from "@/components/DataTable"
import { ColumnDef } from "@tanstack/react-table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

interface AboutUs {
  id: number
  description: string
  description_ka: string | null
  video_url: string
}

interface Member {
  id: string
  name: string
  name_ka: string | null
  role: string
  role_ka: string | null
  image_url: string | null
  created_at: string
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-600",
  "bg-yellow-600",
  "bg-red-500",
  "bg-purple-500",
  "bg-pink-500",
]

function getColor(name: string) {
  if (!name) return AVATAR_COLORS[0]
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export default function AboutUsPage() {
  const [data, setData] = useState<AboutUs | null>(null)
  const [videoPublicUrl, setVideoPublicUrl] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [lang, setLang] = useState<"en" | "ka">("en")

  const [members, setMembers] = useState<Member[]>([])
  const [memberSheetOpen, setMemberSheetOpen] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)

  const fetchAboutUs = useCallback(async () => {
    const supabase = createClient()

    const { data } = await supabase.from("about_us").select("*").single()
    if (data) {
      setData(data)
      if (data.video_url) {
        const { data: urlData } = supabase.storage
          .from("about-images")
          .getPublicUrl(data.video_url)
        setVideoPublicUrl(urlData?.publicUrl ?? null)
      }
    }

    const { data: membersData } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: true })
    if (membersData) setMembers(membersData)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()

      const { data } = await supabase.from("about_us").select("*").single()
      if (cancelled) return
      if (data) {
        setData(data)
        if (data.video_url) {
          const { data: urlData } = supabase.storage
            .from("about-images")
            .getPublicUrl(data.video_url)
          setVideoPublicUrl(urlData?.publicUrl ?? null)
        }
      }

      const { data: membersData } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: true })
      if (cancelled) return
      if (membersData) setMembers(membersData)
    }

    load()
    return () => { cancelled = true }
  }, [])

  const handleDeleteMember = async (id: string, imageUrl: string | null) => {
    const supabase = createClient()
    const { error } = await supabase.from("members").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete member", { description: error.message })
      return
    }

    if (imageUrl) {
      try {
        const url = new URL(imageUrl)
        const pathParts = url.pathname.split("/public/member-images/")
        if (pathParts.length >= 2) {
          const filePath = decodeURIComponent(pathParts[1])
          const { error: storageError } = await supabase.storage
            .from("member-images")
            .remove([filePath])
          if (storageError) {
            toast.warning("Member deleted but failed to remove photo from storage", {
              description: storageError.message,
            })
            fetchAboutUs()
            return
          }
        }
      } catch {
        toast.warning("Member deleted but could not parse image URL")
      }
    }

    toast.success("Member deleted")
    fetchAboutUs()
  }

  const displayDescription = lang === "ka" && data?.description_ka
    ? data.description_ka
    : data?.description

  const columns: ColumnDef<Member>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "image_url",
      header: "იმიჯი",
      cell: ({ row }) =>
        row.original.image_url ? (
          <img
            src={row.original.image_url}
            alt={row.original.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getColor(
              row.original.name
            )}`}
          >
            {row.original.name.charAt(0)}
          </div>
        ),
    },
    {
      accessorKey: "name",
      header: "სახელი",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap">
          {lang === "ka" && row.original.name_ka
            ? row.original.name_ka
            : row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "role",
      header: "როლი",
      cell: ({ row }) => {
        const role = lang === "ka" && row.original.role_ka
          ? row.original.role_ka
          : row.original.role
        return <span>{role || "—"}</span>
      },
    },
    {
      accessorKey: "created_at",
      header: "შეუერთდა",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("en-US"),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="gap-2"
              onClick={() => {
                setEditMember(row.original)
                setMemberSheetOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
              დააედითე
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => handleDeleteMember(row.original.id, row.original.image_url)}
            >
              <Trash2 className="h-4 w-4" />
              წაშალე
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">ჩვენს შესახებ</h1>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border p-0.5 gap-0.5">
            <Button
              variant={lang === "en" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setLang("en")}
            >
              EN
            </Button>
            <Button
              variant={lang === "ka" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setLang("ka")}
            >
              KA
            </Button>
          </div>

          <Button onClick={() => setSheetOpen(true)}>
            <Pencil />
            დააედითე
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-xl bg-sidebar p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground">აღწერა</p>
          <p className="text-sm font-semibold leading-relaxed">
            {displayDescription ?? "No description yet."}
          </p>
        </Card>

        <div className="rounded-xl border border-border bg-sidebar p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground">მთავარი ვიდეო</p>
          {videoPublicUrl ? (
            <div className="rounded-lg overflow-hidden aspect-video w-full bg-black">
              <video src={videoPublicUrl} controls className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-lg bg-black flex flex-col items-center justify-center aspect-video w-full gap-2">
              <p className="text-sm text-muted-foreground">არარის ვიდეოები.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">გუნდის წევრები</h2>
          <Button
            onClick={() => {
              setEditMember(null)
              setMemberSheetOpen(true)
            }}
          >
            <Plus />
            დაამატე გუნდის წევრი
          </Button>
        </div>

        <DataTable data={members} columns={columns} defaultPageSize={10} />
      </div>

      <SheetPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="დააედითე ჩვენს შესახებ გვერდი"
        description="დაააფდეითე აკადემიის „ჩვენს შესახებ„ გვერდი."
        side="right"
        className="w-125 sm:max-w-125 p-4"
      >
        <AboutUsForm
          data={data}
          onSuccess={() => {
            setSheetOpen(false)
            fetchAboutUs()
          }}
        />
      </SheetPanel>

      <SheetPanel
        open={memberSheetOpen}
        onOpenChange={(open) => {
          setMemberSheetOpen(open)
          if (!open) setEditMember(null)
        }}
        title={editMember ? "დააედითე გუნდის წევრი" : "დაამატე გუნდის წევრი"}
        description={editMember ? "დაააფდეითე გუნდის წევრის ინფორმაცია." : "დაამატე ახალი გუნდის წევრი."}
        side="right"
        className="w-125 sm:max-w-125 p-4"
      >
        <MembersForm
          member={editMember}
          onSuccess={() => {
            setMemberSheetOpen(false)
            setEditMember(null)
            fetchAboutUs()
          }}
        />
      </SheetPanel>
    </div>
  )
}