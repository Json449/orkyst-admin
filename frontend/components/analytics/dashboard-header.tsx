"use client"

import { Button } from "@/components/ui/button"
import { OrkystLogo } from "@/components/orkyst-logo"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, RefreshCw } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="text-primary">
          <OrkystLogo className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Analytics & Insights
          </h1>
          <p className="text-sm text-muted-foreground">
            Track performance and engagement metrics
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Select defaultValue="30d">
          <SelectTrigger className="w-[150px]">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
    </header>
  )
}
