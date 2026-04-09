"use client"

import { ThemeToggle } from "../ToggleThemeChange"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function Header({ triger }: any) {
  return (
    <div className="w-full py-1 flex items-center justify-between px-4 border-b">
      {triger}

      {/* <Button variant="outline" onClick={() => toast("Test toast")}>
        Test Toast
      </Button> */}

      <ThemeToggle />
    </div>
  )
}