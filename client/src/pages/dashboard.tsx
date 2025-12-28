import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MultiMetricChart } from "@/components/performance-chart";
import { InlineDataState } from "@/components/data-state";
import {
  FileText,
  Search,
  Eye,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import type { Article, Keyword } from "@shared/schema";

interface ApiError {
  error: string;
  message?: string;
  requiresConnection?: boolean;
}

export default function Dashboard() {
  const { data: stats } = useQuery<{
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalKeywords: number;
    avgSeoScore: number;
    totalClicks: number;
    totalImpressions: number;
    avgPosition: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: recentArticles } = useQuery<Article[]>({
    queryKey: ["/api/articles?limit=5"],
  });

  const { data: topKeywords } = useQuery<Keyword[]>({
    queryKey: ["/api/keywords?limit=5&sort=clicks"],
  });

  const { data: performanceData, error: performanceError, isError: isPerformanceError } = useQuery<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[], Error>({
    queryKey: ["/api/performance/chart"],
    retry: false,
  });
  
  const performanceApiError = isPerformanceError ? 
    (performanceError as any)?.message?.includes("requiresConnection") ||
    (performanceError as any)?.message?.includes("not connected") : false;

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Content performance overview for Psychic Source
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Articles"
          value={stats?.totalArticles ?? 0}
          icon={<FileText className="h-4 w-4" />}
        />
        <MetricCard
          title="Tracked Keywords"
          value={stats?.totalKeywords ?? 0}
          icon={<Search className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Clicks"
          value={stats?.totalClicks?.toLocaleString() ?? "0"}
          change={12.5}
          changeLabel="vs last month"
          icon={<Eye className="h-4 w-4" />}
        />
        <MetricCard
          title="Avg. Position"
          value={stats?.avgPosition?.toFixed(1) ?? "--"}
          change={-2.3}
          changeLabel="improvement"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isPerformanceError ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <InlineDataState
                  status="disconnected"
                  title="Google Search Console Not Connected"
                  message="Connect GSC in Integrations to see search performance data."
                  actions={[{ label: "Go to Integrations", href: "/integrations" }]}
                />
              </CardContent>
            </Card>
          ) : (
            <MultiMetricChart
              data={performanceData || []}
              title="Performance Trend"
            />
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/create">
              <Button className="w-full justify-start" variant="outline" data-testid="button-new-article">
                <Sparkles className="mr-2 h-4 w-4" />
                Create New Article
              </Button>
            </Link>
            <Link href="/keywords">
              <Button className="w-full justify-start" variant="outline" data-testid="button-keyword-research">
                <Search className="mr-2 h-4 w-4" />
                Keyword Research
              </Button>
            </Link>
            <Link href="/updates">
              <Button className="w-full justify-start" variant="outline" data-testid="button-content-audit">
                <Clock className="mr-2 h-4 w-4" />
                Content Audit
              </Button>
            </Link>
            <Link href="/integrations">
              <Button className="w-full justify-start" variant="outline" data-testid="button-integrations">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Manage Integrations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Recent Articles</CardTitle>
            <Link href="/content">
              <Button variant="ghost" size="sm" data-testid="link-view-all-articles">
                View All
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[280px]">
              <div className="space-y-1 p-4">
                {!recentArticles || recentArticles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No articles yet</p>
                  </div>
                ) : (
                  recentArticles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg hover-elevate"
                      data-testid={`article-item-${article.id}`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{article.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {article.category || "Uncategorized"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={article.status === "published" ? "default" : "secondary"}
                          className={
                            article.status === "published"
                              ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                              : ""
                          }
                        >
                          {article.status}
                        </Badge>
                        {article.seoScore && (
                          <span className="text-sm font-mono text-muted-foreground">
                            {article.seoScore}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Top Keywords</CardTitle>
            <Link href="/keywords">
              <Button variant="ghost" size="sm" data-testid="link-view-all-keywords">
                View All
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[280px]">
              <div className="space-y-1 p-4">
                {!topKeywords || topKeywords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No keywords tracked</p>
                  </div>
                ) : (
                  topKeywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg hover-elevate"
                      data-testid={`keyword-item-${keyword.id}`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{keyword.keyword}</div>
                        <div className="text-xs text-muted-foreground">
                          Vol: {keyword.volume?.toLocaleString() || "--"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-mono">
                            #{keyword.currentPosition || "--"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {keyword.clicks?.toLocaleString() || 0} clicks
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
