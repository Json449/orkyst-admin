"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, TrendingUp, CalendarPlus, BarChart3, Check } from "lucide-react";
import { fetchRecommendations, type RecommendationsData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const impactColors: Record<string, string> = {
  high:   "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-gray-100 text-gray-700",
};

export function AIRecommendationsWidget() {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [importedItems, setImportedItems] = useState<string[]>([]);

  useEffect(() => {
    fetchRecommendations().then(setData).finally(() => setLoading(false));
  }, []);

  const recs = data?.recommendations ?? [];
  const allImported = recs.length > 0 && importedItems.length === recs.length;

  const handleImport = (id: string) => {
    if (!importedItems.includes(id)) setImportedItems((prev) => [...prev, id]);
  };

  const handleImportAll = () => {
    setImportedItems(recs.map((r) => r.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">AI Recommendations</h2>
        <Badge variant="secondary" className="ml-2 text-xs">Powered by AI</Badge>
      </div>

      {/* Quick Insights Row */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : (
          [
            { label: "Best day",     value: data?.bestDay ?? "—",      icon: BarChart3  },
            { label: "Best time",    value: data?.bestTime ?? "—",     icon: Clock      },
            { label: "Top platform", value: data?.topPlatform ?? "—",  icon: TrendingUp },
          ].map((insight) => (
            <Card key={insight.label} className="shadow-sm border-0">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <insight.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{insight.label}</p>
                  <p className="text-lg font-semibold text-foreground">{insight.value}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recommendations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {recs.map((rec) => (
            <Card key={rec.id} className="shadow-sm border-0 transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{rec.title}</h3>
                      <Badge className={`${impactColors[rec.impact] ?? impactColors.low} text-xs border-0`}>
                        {rec.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs font-medium text-green-600">{rec.metricLabel}</span>
                      </div>
                      {importedItems.includes(rec.id) ? (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600 hover:text-green-600 cursor-default">
                          <Check className="mr-1 h-3 w-3" />
                          Added to Calendar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleImport(rec.id)}
                        >
                          <CalendarPlus className="mr-1 h-3 w-3" />
                          Add to Calendar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Card */}
      {!loading && data && (
        <Card className="shadow-sm border-0 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {data.insight}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {allImported
                      ? "All recommendations added to your calendar"
                      : `${importedItems.length} of ${recs.length} recommendations added to calendar`}
                    {data.projectedUpliftPct > 0 && ` · ~${data.projectedUpliftPct}% projected uplift`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {allImported ? (
                  <Button className="bg-green-600 hover:bg-green-600 cursor-default">
                    <Check className="mr-2 h-4 w-4" />
                    All Added
                  </Button>
                ) : (
                  <Button className="bg-primary hover:bg-primary/90" onClick={handleImportAll}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Import All to Calendar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
