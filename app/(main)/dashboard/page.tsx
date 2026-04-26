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
  Users, Eye,
} from "lucide-react"
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { DailyUsersChart } from "@/components/Analytics/DailyUsersChart"
import { ActiveNowCard } from "@/components/Analytics/ActiveNowCard"

export const revalidate = 300

const sections = [
  { title: "ადმინები", icon: UserRoundKey, href: "/admins", description: "ადმინისტრატორების მართვა" },
  { title: "სერვისები", icon: MonitorCloud, href: "/services", description: "სერვისების მართვა" },
  { title: "პროექტები", icon: FolderOpenDot, href: "/projects", description: "ყველა პროექტის ნახვა" },
  { title: "ტესტიმონიალები", icon: MessageSquare, href: "/client-responses", description: "კლიენტების გამოხმაურებების მიმოხილვა" },
  { title: "ბლოგები", icon: Notebook, href: "/blogs", description: "ბლოგების წერა და მართვა" },
  { title: "სამუშაოები", icon: MonitorCog, href: "/works", description: "შესრულებული სამუშაოების პრეზენტაცია" },
  { title: "ჩვენს შესახებ", icon: UsersRound, href: "/about-us", description: "ჩვენს შესახებ გვერდის რედაქტირება" },
  { title: "კონტაქტები", icon: Mail, href: "/contact", description: "საკონტაქტო ინფორმაციის მართვა" },
]

async function getAnalyticsData() {
  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GA_CLIENT_EMAIL,
        private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    })

    const [report, realtime, dailyReport] = await Promise.all([
      analyticsDataClient.runReport({
        property: `properties/${process.env.GA_PROPERTY_ID}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
      }),
      analyticsDataClient.runRealtimeReport({
        property: `properties/${process.env.GA_PROPERTY_ID}`,
        minuteRanges: [{ startMinutesAgo: 29, endMinutesAgo: 0 }],
        metrics: [{ name: 'activeUsers' }],
      }),
      analyticsDataClient.runReport({
        property: `properties/${process.env.GA_PROPERTY_ID}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
    ])

    const dailyUsers = dailyReport[0].rows?.map((row) => ({
      date: row.dimensionValues?.[0]?.value?.replace(
        /(\d{4})(\d{2})(\d{2})/,
        '$2/$3'
      ) || '',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || []

    return {
      totalUsers: report[0].rows?.[0]?.metricValues?.[0]?.value || '0',
      totalPageViews: report[0].rows?.[0]?.metricValues?.[1]?.value || '0',
      activeNow: realtime[0].rows?.[0]?.metricValues?.[0]?.value || '0',
      dailyUsers,
    }
  } catch (error) {
    console.error('Analytics error:', error)
    return { totalUsers: '0', totalPageViews: '0', activeNow: '0', dailyUsers: [] }
  }
}

export default async function DashboardPage() {
  const analytics = await getAnalyticsData()

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <h1 className="text-2xl font-bold">დაშბორდი</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              მომხმარებლები (30 დღე)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              გვერდის ნახვები (30 დღე)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalPageViews}</p>
          </CardContent>
        </Card>

        <ActiveNowCard initialValue={analytics.activeNow} />
      </div>

      <DailyUsersChart data={analytics.dailyUsers} />

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