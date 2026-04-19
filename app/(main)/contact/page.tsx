"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Phone, Mail, MapPin, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SheetPanel } from "@/components/Sheet/Sheet"
import ContactForm from "@/components/Contact/ContactForm"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const supabase = createClient()

interface IContact {
  id: number
  phone_number: string
  academy_email: string
  academy_adress: string
}

interface IMessage {
  id: string
  name: string
  email: string
  message: string
  created_at: string
}

export default function ContactPage() {
  "use no memo"

  const [data, setData] = useState<IContact[]>([])
  const [messages, setMessages] = useState<IMessage[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<IMessage | null>(null)
  const [contactSorting, setContactSorting] = useState<SortingState>([])
  const [messageSorting, setMessageSorting] = useState<SortingState>([])
  const [messagePagination, setMessagePagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  const fetchContact = useCallback(async () => {
    const { data } = await supabase.from("contact").select("*")
    if (data) setData(data)
  }, [])

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setMessages(data)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [{ data: contactData }, { data: messagesData }] = await Promise.all([
        supabase.from("contact").select("*"),
        supabase.from("messages").select("*").order("created_at", { ascending: false }),
      ])

      if (cancelled) return
      if (contactData) setData(contactData)
      if (messagesData) setMessages(messagesData)
    }

    load()
    return () => { cancelled = true }
  }, [])

  const handleMessageDelete = useCallback(async (id: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete message", { description: error.message })
    } else {
      toast.success("Message deleted")
      fetchMessages()
    }
  }, [fetchMessages])

  const contact = data[0]

  const contactColumns = useMemo<ColumnDef<IContact>[]>(
    () => [
      {
        accessorKey: "phone_number",
        id: "phone_number",
        header: "ტელეფონის ნომერი",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />
            <span>{(info.getValue() as string) ?? "—"}</span>
          </div>
        ),
        size: 200,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "academy_email",
        id: "academy_email",
        header: "აკადემიის ემაილი",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <span className="text-blue-600 dark:text-blue-400">
              {(info.getValue() as string) ?? "—"}
            </span>
          </div>
        ),
        size: 260,
      },
      {
        accessorKey: "academy_adress",
        id: "academy_adress",
        header: "აკადემიის მისამართი",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <span>{(info.getValue() as string) ?? "—"}</span>
          </div>
        ),
        size: 300,
      },
    ],
    []
  )

  const messageColumns = useMemo<ColumnDef<IMessage>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: "სახელი",
        cell: (info) => <span>{(info.getValue() as string) ?? "—"}</span>,
        size: 180,
      },
      {
        accessorKey: "email",
        id: "email",
        header: "ემაილი",
        cell: (info) => (
          <span className="text-blue-600 dark:text-blue-400">
            {(info.getValue() as string) ?? "—"}
          </span>
        ),
        size: 240,
      },
      {
        accessorKey: "message",
        id: "message",
        header: "მესიჯი",
        cell: ({ row }) => (
          <span
            className="line-clamp-1 cursor-pointer hover:text-foreground text-muted-foreground transition-colors"
            onClick={() => setSelectedMessage(row.original)}
          >
            {row.original.message ?? "—"}
          </span>
        ),
        size: 380,
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: "თარიღი",
        cell: (info) => (
          <span className="text-muted-foreground text-sm">
            {new Date(info.getValue() as string).toLocaleString()}
          </span>
        ),
        size: 200,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => handleMessageDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleMessageDelete]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const contactTable = useReactTable({
    columns: contactColumns,
    data,
    getRowId: (row: IContact) => String(row.id),
    state: { sorting: contactSorting },
    onSortingChange: setContactSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

   
  const messageTable = useReactTable({
    columns: messageColumns,
    data: messages,
    pageCount: Math.ceil(messages.length / messagePagination.pageSize),
    getRowId: (row: IMessage) => row.id,
    state: {
      sorting: messageSorting,
      pagination: messagePagination,
    },
    onSortingChange: setMessageSorting,
    onPaginationChange: setMessagePagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <>
      <DataGrid
        table={contactTable}
        recordCount={data.length}
        tableLayout={{ cellBorder: true }}
      >
        <div className="w-full p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">კონტაქტი</h1>
              <p className="text-sm text-muted-foreground">
                აკადემიის საჯარო საკონტაქტო ინფორმაცია
              </p>
            </div>
            <Button onClick={() => setSheetOpen(true)}>
              <Pencil />
              დააედითე კონტაქტი
            </Button>
          </div>

          <DataGridContainer>
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
        </div>

        <SheetPanel
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Edit Contact"
          description="Update the academy's contact information."
          side="right"
          className="w-[500px] sm:max-w-[500px] p-4"
        >
          <ContactForm
            defaultValues={contact}
            onSuccess={() => {
              setSheetOpen(false)
              fetchContact()
            }}
          />
        </SheetPanel>
      </DataGrid>

      <DataGrid
        table={messageTable}
        recordCount={messages.length}
        tableLayout={{ cellBorder: true }}
      >
        <div className="w-full p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">მომხმარებლების მესიჯები</h1>
              <p className="text-sm text-muted-foreground">
                იმ მომხმარებელტა სია რომლებიც დაუკავშირდა აკადემიას
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <DataGridContainer>
              <DataGridScrollArea>
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
            <DataGridPagination />
          </div>
        </div>
      </DataGrid>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>მესიჯი {selectedMessage?.name} სგან</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground">ემაილი</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">{selectedMessage?.email}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground">მესიჯი</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {selectedMessage?.message}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}