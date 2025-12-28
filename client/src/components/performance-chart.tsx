import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { useState } from "react";

interface PerformanceData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  title?: string;
}

export function PerformanceChart({ data, title = "Performance Overview" }: PerformanceChartProps) {
  const [metric, setMetric] = useState<"clicks" | "impressions" | "ctr" | "position">("clicks");

  const metricConfig = {
    clicks: { label: "Clicks", color: "hsl(var(--chart-1))", format: (v: number) => v.toLocaleString() },
    impressions: { label: "Impressions", color: "hsl(var(--chart-2))", format: (v: number) => v.toLocaleString() },
    ctr: { label: "CTR", color: "hsl(var(--chart-3))", format: (v: number) => `${v.toFixed(2)}%` },
    position: { label: "Avg. Position", color: "hsl(var(--chart-4))", format: (v: number) => v.toFixed(1) },
  };

  const config = metricConfig[metric];

  return (
    <Card data-testid="performance-chart">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Select value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
          <SelectTrigger className="w-[140px]" data-testid="select-metric">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clicks">Clicks</SelectItem>
            <SelectItem value="impressions">Impressions</SelectItem>
            <SelectItem value="ctr">CTR</SelectItem>
            <SelectItem value="position">Position</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0} />
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
                tickFormatter={config.format}
                reversed={metric === "position"}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [config.format(value), config.label]}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={config.color}
                strokeWidth={2}
                fill={`url(#gradient-${metric})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface MultiMetricChartProps {
  data: PerformanceData[];
  title?: string;
}

export function MultiMetricChart({ data, title = "Clicks vs Impressions" }: MultiMetricChartProps) {
  return (
    <Card data-testid="multi-metric-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
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
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="clicks"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
                name="Clicks"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="impressions"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
                name="Impressions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
