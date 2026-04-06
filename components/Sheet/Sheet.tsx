"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface SheetPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  side?: "left" | "right" | "top" | "bottom"
  className?: string
  children: React.ReactNode
}

export function SheetPanel({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  className,
  children,
}: SheetPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={className}>
        <SheetHeader className="p-0 flex items-start justify-between">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        {children}
      </SheetContent>
    </Sheet>
  )
}