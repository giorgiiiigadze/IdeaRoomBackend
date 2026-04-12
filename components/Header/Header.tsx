"use client"

import { ThemeToggle } from "../ToggleThemeChange"
import React from "react"

type HeaderProps = {
  triger: React.ReactElement
}

export default function Header({ triger }: HeaderProps) {
  return (
    <div className="w-full py-1 flex items-center justify-between px-4 border-b">
      {triger}
      <ThemeToggle />
    </div>
  )
}