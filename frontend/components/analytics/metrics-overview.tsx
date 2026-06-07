"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2 } from "lucide-react"

const metrics = [
  {
    label: "Total Impressions",
    value: "248.5K",
    change: "+12.5%",
    trend: "up",
    icon: Eye,
  },
  {
    label: "Engagement Rate",
    value: "4.8%",
    change: "+0.8%",
    trend: "up",
    icon: Heart,
  },
  {
    label: "Comments",
    value: "1,247",
    change: "+24.3%",
    trend: "up",
    icon: MessageCircle,
  },
  {
    label: "Shares",
    value: "892",
    change: "-3.2%",
    trend: "down",
    icon: Share2,
  },
]

export function MetricsOverview() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown
        return (
          <Card key={metric.label} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    metric.trend === "up"
                      ? "text-success bg-success/10"
                      : "text-destructive bg-destructive/10"
                  }`}
                >
                  <TrendIcon className="w-3 h-3" />
                  {metric.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-semibold text-foreground">{metric.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{metric.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
