"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Phone, Mail, MapPin, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SheetPanel } from "@/components/Sheet/Sheet"
import ContactForm from "@/components/Contact/ContactForm"

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
  const [data, setData] = useState<IContact[]>([])
  const [messages, setMessages] = useState<IMessage[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [contactSorting, setContactSorting] = useState<SortingState>([])
  const [messageSorting, setMessageSorting] = useState<SortingState>([])
  const [messagePagination, setMessagePagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })
  const supabase = createClient()

  const fetchContact = async () => {
    const { data } = await supabase.from("contact").select("*")
    if (data) setData(data)
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setMessages(data)
  }

  useEffect(() => {
    fetchContact()
    fetchMessages()
  }, [])

  const contact = data[0]

  const contactColumns = useMemo<ColumnDef<IContact>[]>(
    () => [
      {
        accessorKey: "phone_number",
        id: "phone_number",
        header: "Phone Number",
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
        header: "Email",
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
        header: "Address",
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
        header: "Name",
        cell: (info) => <span>{(info.getValue() as string) ?? "—"}</span>,
        size: 180,
      },
      {
        accessorKey: "email",
        id: "email",
        header: "Email",
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
        header: "Message",
        cell: (info) => (
          <span className="line-clamp-1">{(info.getValue() as string) ?? "—"}</span>
        ),
        size: 380,
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: "Date",
        cell: (info) => (
          <span className="text-muted-foreground text-sm">
            {new Date(info.getValue() as string).toLocaleString()}
          </span>
        ),
        size: 200,
      },
    ],
    []
  )

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
              <h1 className="text-2xl font-semibold tracking-tight">Contact</h1>
              <p className="text-sm text-muted-foreground">
                The academy's public contact information.
              </p>
            </div>
            <Button onClick={() => setSheetOpen(true)}>
              <Pencil />
              Edit Contact
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
              <h1 className="text-2xl font-semibold tracking-tight">User Messages</h1>
              <p className="text-sm text-muted-foreground">
                The list of users who contacted the academy.
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
    </>
  )
}