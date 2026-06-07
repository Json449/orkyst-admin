"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const platforms = [
  { name: "LinkedIn", engagement: 6.2, posts: 24, color: "#0077B5" },
  { name: "Instagram", engagement: 4.8, posts: 32, color: "#E4405F" },
  { name: "Twitter", engagement: 3.4, posts: 45, color: "#1DA1F2" },
  { name: "Facebook", engagement: 2.1, posts: 18, color: "#1877F2" },
]

const maxEngagement = Math.max(...platforms.map((p) => p.engagement))

export function PlatformBreakdown() {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Platform Performance</CardTitle>
        <p className="text-sm text-muted-foreground">Engagement rate by platform</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platforms.map((platform) => (
            <div key={platform.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{platform.name}</span>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="text-xs">{platform.posts} posts</span>
                  <span className="font-medium text-foreground">{platform.engagement}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(platform.engagement / maxEngagement) * 100}%`,
                    backgroundColor: platform.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Posts</span>
            <span className="font-semibold text-foreground">
              {platforms.reduce((acc, p) => acc + p.posts, 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Avg. Engagement</span>
            <span className="font-semibold text-foreground">
              {(platforms.reduce((acc, p) => acc + p.engagement, 0) / platforms.length).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
