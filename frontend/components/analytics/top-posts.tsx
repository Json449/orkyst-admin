"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, TrendingUp } from "lucide-react"

const posts = [
  {
    id: 1,
    title: "5 AI Trends Reshaping Marketing in 2026",
    platform: "LinkedIn",
    sentiment: "positive",
    likes: 1247,
    comments: 89,
    shares: 234,
    date: "Jan 15",
  },
  {
    id: 2,
    title: "Behind the scenes of our new product launch",
    platform: "Instagram",
    sentiment: "positive",
    likes: 2341,
    comments: 156,
    shares: 89,
    date: "Jan 12",
  },
  {
    id: 3,
    title: "Customer success story: How we helped scale 10x",
    platform: "Twitter",
    sentiment: "positive",
    likes: 892,
    comments: 67,
    shares: 178,
    date: "Jan 10",
  },
  {
    id: 4,
    title: "Industry report: State of Digital Marketing",
    platform: "LinkedIn",
    sentiment: "neutral",
    likes: 567,
    comments: 45,
    shares: 123,
    date: "Jan 8",
  },
]

const platformColors: Record<string, string> = {
  LinkedIn: "bg-[#0077B5]/10 text-[#0077B5]",
  Instagram: "bg-[#E4405F]/10 text-[#E4405F]",
  Twitter: "bg-foreground/10 text-foreground",
  Facebook: "bg-[#1877F2]/10 text-[#1877F2]",
}

const sentimentColors: Record<string, string> = {
  positive: "bg-success/10 text-success",
  neutral: "bg-muted text-muted-foreground",
  negative: "bg-destructive/10 text-destructive",
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

export function TopPosts() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Top Performing Posts</CardTitle>
            <p className="text-sm text-muted-foreground">Posts with highest engagement</p>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-col gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm leading-snug line-clamp-2">
                    {post.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{post.date}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className={platformColors[post.platform]}>
                    {post.platform}
                  </Badge>
                  <Badge variant="secondary" className={sentimentColors[post.sentiment]}>
                    {post.sentiment}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-xs">{formatNumber(post.likes)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="text-xs">{post.comments}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-xs">{post.shares}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
