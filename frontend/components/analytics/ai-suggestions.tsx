"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, RefreshCw, Lightbulb, Clock, Target, Zap, ArrowRight } from "lucide-react"

const suggestions = [
  {
    id: 1,
    type: "timing",
    icon: Clock,
    title: "Optimal Posting Time",
    description: "Your audience is most active between 9-11 AM EST. Consider scheduling key posts during this window.",
    impact: "high",
  },
  {
    id: 2,
    type: "content",
    icon: Lightbulb,
    title: "Content Format",
    description: "Video posts are generating 3.2x more engagement than images. Try creating more short-form video content.",
    impact: "high",
  },
  {
    id: 3,
    type: "audience",
    icon: Target,
    title: "Audience Insight",
    description: "Tech professionals aged 25-34 show highest engagement. Tailor content to address their pain points.",
    impact: "medium",
  },
  {
    id: 4,
    type: "optimization",
    icon: Zap,
    title: "Caption Optimization",
    description: "Your best performing posts have captions between 150-200 characters. Current average is 280 characters.",
    impact: "medium",
  },
]

const impactColors: Record<string, string> = {
  high: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning-foreground",
  low: "bg-muted text-muted-foreground",
}

export function AISuggestions() {
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-medium">AI Insights</CardTitle>
              <p className="text-sm text-muted-foreground">Recommendations based on performance</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon
            return (
              <div
                key={suggestion.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground text-sm">
                        {suggestion.title}
                      </h4>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${impactColors[suggestion.impact]}`}
                      >
                        {suggestion.impact} impact
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {suggestion.description}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-2 text-primary hover:text-primary/80"
                    >
                      Take action
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
