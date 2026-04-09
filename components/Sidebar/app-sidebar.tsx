"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CurrentUserAvatar } from "../current-user-avatar"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, MessageSquare, Notebook, MonitorCog, ChevronsUpDown, LogOut, UserRoundKey, MonitorCloud, Mail, UsersRound } from "lucide-react"
import type { User } from "@supabase/supabase-js"

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard"},
  { title: "Admins", icon: UserRoundKey, href: "/admins"},
  { title: "Services", icon: MonitorCloud, href: "/services"},
  { title: "Client Responses", icon: MessageSquare, href: "/client-responses"},
  { title: "Blogs", icon: Notebook, href: "/blogs"},
  { title: "Works", icon: MonitorCog, href: "/works"},
  { title: "About Us", icon: UsersRound, href: "/about-us"},
  { title: "Contact", icon: Mail, href: "/contact"},
]

export function AppSidebar() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3 text-lg font-semibold">
        Idearoom backend
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors cursor-pointer">
              <CurrentUserAvatar />
              <div className="flex flex-col min-w-0 flex-1 text-left">
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="center" className="w-full">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{user?.user_metadata?.full_name ?? "Admin"}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}