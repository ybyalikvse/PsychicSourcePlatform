import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/metric-card";
import { PerformanceChart, MultiMetricChart } from "@/components/performance-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataState } from "@/components/data-state";
import { Eye, MousePointer, TrendingUp, BarChart3, ExternalLink } from "lucide-react";

interface TopPage {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export default function Performance() {
  const [dateRange, setDateRange] = useState("30d");

  const { data: stats, isError: isStatsError } = useQuery<{
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
  }>({
    queryKey: ["/api/performance/stats", dateRange],
    retry: false,
  });

  const { data: chartData, isError: isChartError } = useQuery<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[]>({
    queryKey: ["/api/performance/chart", dateRange],
    retry: false,
  });

  const { data: topPages, isError: isTopPagesError } = useQuery<TopPage[]>({
    queryKey: ["/api/performance/top-pages", dateRange],
    retry: false,
  });
  
  const isDisconnected = isStatsError || isChartError || isTopPagesError;

  if (isDisconnected) {
    return (
      <div className="space-y-6" data-testid="page-performance">
        <div>
          <h1 className="text-2xl font-semibold">Performance</h1>
          <p className="text-muted-foreground">
            Search performance from Google Search Console
          </p>
        </div>
        <DataState
          status="disconnected"
          title="Google Search Console Not Connected"
          message="Connect your Google Search Console account to view search performance data including clicks, impressions, CTR, and ranking positions."
          actions={[
            { label: "Connect Google Search Console", href: "/integrations" },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-performance">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Performance</h1>
          <p className="text-muted-foreground">
            Search performance from Google Search Console
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]" data-testid="select-date-range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Clicks"
          value={stats?.totalClicks?.toLocaleString() ?? "0"}
          change={12.3}
          changeLabel="vs previous"
          icon={<MousePointer className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Impressions"
          value={stats?.totalImpressions?.toLocaleString() ?? "0"}
          change={18.7}
          changeLabel="vs previous"
          icon={<Eye className="h-4 w-4" />}
        />
        <MetricCard
          title="Avg. CTR"
          value={`${stats?.avgCtr?.toFixed(2) ?? "0"}%`}
          change={0.5}
          changeLabel="vs previous"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MetricCard
          title="Avg. Position"
          value={stats?.avgPosition?.toFixed(1) ?? "--"}
          change={-2.1}
          changeLabel="improvement"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceChart data={chartData || []} title="Performance Trend" />
        <MultiMetricChart data={chartData || []} title="Clicks vs Impressions" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Pages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {!topPages || topPages.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No performance data available yet.
                </div>
              ) : (
                topPages.map((page, index) => (
                  <div
                    key={page.url}
                    className="flex items-center gap-4 p-4 hover-elevate"
                    data-testid={`page-item-${index}`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-medium hover:underline truncate"
                      >
                        {page.url.replace(/^https?:\/\/[^/]+/, "")}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center gap-6 text-sm shrink-0">
                      <div className="text-right">
                        <div className="font-mono">{page.clicks.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">clicks</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">{page.impressions.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">impressions</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">{page.ctr.toFixed(2)}%</div>
                        <div className="text-xs text-muted-foreground">CTR</div>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        #{page.position.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
