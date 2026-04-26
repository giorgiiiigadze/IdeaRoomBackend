'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Radio } from "lucide-react"

export function ActiveNowCard({ initialValue }: { initialValue: string }) {
  const [activeNow, setActiveNow] = useState(initialValue)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/active-users')
        if (!res.ok) return
        const data = await res.json()
        setActiveNow(data.activeNow ?? '0')
      } catch (err) {
        console.error('Failed to fetch active users:', err)
      } finally {
        setLoading(false)
      }
    }

    const interval = setInterval(fetchActiveUsers, 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <Radio className={`h-4 w-4 text-green-500 ${loading ? '' : 'animate-pulse'}`} />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          აქტიურები (ბოლო 30 წუთი)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-green-500">{activeNow}</p>
      </CardContent>
    </Card>
  )
}