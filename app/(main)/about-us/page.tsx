"use client"

import { useEffect, useState } from "react"
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

interface IAboutUs {
  id: number
  description: string
  video_url: string
}

interface Member {
  id: string
  name: string
  role: string
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
  const supabase = createClient()
  const [data, setData] = useState<IAboutUs | null>(null)
  const [videoPublicUrl, setVideoPublicUrl] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [members, setMembers] = useState<Member[]>([])
  const [memberSheetOpen, setMemberSheetOpen] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)

  const fetchAboutUs = async () => {
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
  }

  useEffect(() => {
    fetchAboutUs()
  }, [])

  const handleDeleteMember = async (id: string) => {
    const { error } = await supabase.from("members").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete member", { description: error.message })
    } else {
      toast.success("Member deleted")
      fetchAboutUs()
    }
  }

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "select",
      header: "Select",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap">Checkbnox here</span>
      ),
    },
    {
      accessorKey: "image_url",
      header: "Avatar",
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
    { accessorKey: "name", header: "Name" },
    { accessorKey: "role", header: "Role", cell: ({ row }) => row.original.role || "—" },
    {
      accessorKey: "created_at",
      header: "Joined",
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
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => handleDeleteMember(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
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
        <h1 className="text-2xl font-semibold tracking-tight">About us</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <Pencil />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-xl bg-sidebar p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground">Description</p>
          <p className="text-sm font-semibold leading-relaxed">
            {data?.description ?? "No description yet."}
          </p>
        </Card>

        <div className="rounded-xl border border-border bg-sidebar p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground">Main Video</p>
          {videoPublicUrl ? (
            <div className="rounded-lg overflow-hidden aspect-video w-full bg-black">
              <video src={videoPublicUrl} controls className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-lg bg-black flex flex-col items-center justify-center aspect-video w-full gap-2">
              <p className="text-sm text-muted-foreground">No video uploaded</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Team Members</h2>
          <Button
            onClick={() => {
              setEditMember(null)
              setMemberSheetOpen(true)
            }}
          >
            <Plus />
            Add Member
          </Button>
        </div>

        <DataTable data={members} columns={columns} defaultPageSize={10} />
      </div>

      <SheetPanel
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Edit About Us"
        description="Update the academy's about us content."
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
        onOpenChange={() => setMemberSheetOpen(false)}
        title={editMember ? "Edit Member" : "Add Member"}
        description={editMember ? "Update the member info." : "Add a new team member."}
        side="right"
        className="w-125 sm:max-w-125 p-4"
      >
        <MembersForm
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