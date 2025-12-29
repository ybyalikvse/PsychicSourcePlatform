import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataState } from "@/components/data-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users, Eye, Clock, MousePointer } from "lucide-react";
import { useState } from "react";

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: string;
  topPages: { page: string; views: number }[];
  trafficSources: { source: string; value: number }[];
  chartData: { date: string; views: number; visitors: number }[];
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Analytics() {
  const [dateRange, setDateRange] = useState("30d");

  const { data: analytics, isError } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", dateRange],
    retry: false,
  });
  
  if (isError) {
    return (
      <div className="space-y-6" data-testid="page-analytics">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground">
            Website traffic and engagement metrics
          </p>
        </div>
        <DataState
          status="disconnected"
          title="Google Analytics Not Connected"
          message="Connect your Google Analytics account to view website traffic, visitor data, and engagement metrics. You'll need your GA4 Property ID after connecting."
          actions={[
            { label: "Connect Google Analytics", href: "/integrations" },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-analytics">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground">
            Website traffic and engagement metrics
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
          title="Page Views"
          value={analytics?.pageViews?.toLocaleString() ?? "0"}
          change={15.2}
          changeLabel="vs previous"
          icon={<Eye className="h-4 w-4" />}
        />
        <MetricCard
          title="Unique Visitors"
          value={analytics?.uniqueVisitors?.toLocaleString() ?? "0"}
          change={8.3}
          changeLabel="vs previous"
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="Bounce Rate"
          value={`${analytics?.bounceRate ?? 0}%`}
          change={-3.2}
          changeLabel="improvement"
          icon={<MousePointer className="h-4 w-4" />}
        />
        <MetricCard
          title="Avg. Session"
          value={analytics?.avgSessionDuration ?? "0:00"}
          change={12.5}
          changeLabel="vs previous"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Traffic Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics?.chartData || []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Page Views"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#colorViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Visitors"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fill="url(#colorVisitors)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.trafficSources || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="source"
                    label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(analytics?.trafficSources || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Pages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {!analytics?.topPages || analytics.topPages.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No page data available yet.
                </div>
              ) : (
                analytics.topPages.map((page, index) => (
                  <div
                    key={page.page}
                    className="flex items-center justify-between gap-4 p-4 hover-elevate"
                    data-testid={`top-page-${index}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className="shrink-0 font-mono">
                        {index + 1}
                      </Badge>
                      <span className="truncate">{page.page}</span>
                    </div>
                    <div className="text-sm font-mono text-muted-foreground shrink-0">
                      {page.views.toLocaleString()} views
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
