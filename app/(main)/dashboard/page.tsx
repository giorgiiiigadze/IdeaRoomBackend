import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  MessageSquare, Notebook, MonitorCog,
  UserRoundKey, MonitorCloud,
  Mail, UsersRound, FolderOpenDot,
} from "lucide-react"

const sections = [
  { title: "Admins", icon: UserRoundKey, href: "/admins", description: "Manage admin users" },
  { title: "Services", icon: MonitorCloud, href: "/services", description: "Manage your services" },
  { title: "Projects", icon: FolderOpenDot, href: "/projects", description: "View all projects" },
  { title: "Client Responses", icon: MessageSquare, href: "/client-responses", description: "Review client feedback" },
  { title: "Blogs", icon: Notebook, href: "/blogs", description: "Write and manage blogs" },
  { title: "Works", icon: MonitorCog, href: "/works", description: "Showcase your works" },
  { title: "About Us", icon: UsersRound, href: "/about-us", description: "Edit about us page" },
  { title: "Contact", icon: Mail, href: "/contact", description: "Manage contact info" },
]

export default async function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full">
        <h1 className="text-2xl font-bold">დაშბორდი</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full min-h-[160px] flex flex-col">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="p-2 rounded-md bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}