import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import {
  Users, Video, BarChart3, FileText, Play, Plus, ArrowRight, TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CiStats {
  totalCompetitors: number;
  videosScraped: number;
  analysesComplete: number;
  briefsGenerated: number;
}

interface RecentAnalysis {
  id: number;
  creator: string;
  topicCategory: string;
  hookType: string;
  views: number;
  replicationScore: number;
}

interface LatestBrief {
  id: number;
  weekLabel: string;
  videoCount: number;
  status: string;
  topTopics: string[];
  itemCount: number;
}

export default function CiDashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<CiStats>({
    queryKey: ["/api/ci/stats"],
  });

  const { data: recentAnalyses = [], isLoading: analysesLoading } = useQuery<RecentAnalysis[]>({
    queryKey: ["/api/ci/stats", "recent-analyses"],
    queryFn: async () => {
      const res = await fetch("/api/ci/analyses?limit=10", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analyses");
      return res.json();
    },
  });

  const { data: latestBrief, isLoading: briefLoading } = useQuery<LatestBrief | null>({
    queryKey: ["/api/ci/stats", "latest-brief"],
    queryFn: async () => {
      const res = await fetch("/api/ci/briefs?limit=1", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch brief");
      const briefs = await res.json();
      return Array.isArray(briefs) && briefs.length > 0 ? briefs[0] : null;
    },
  });

  const statCards = [
    {
      title: "Total Competitors",
      value: stats?.totalCompetitors ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Videos Scraped",
      value: stats?.videosScraped ?? 0,
      icon: Video,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Analyses Complete",
      value: stats?.analysesComplete ?? 0,
      icon: BarChart3,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Briefs Generated",
      value: stats?.briefsGenerated ?? 0,
      icon: FileText,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  function formatViews(views: number): string {
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
    return String(views);
  }

  function getScoreColor(score: number): string {
    if (score >= 4) return "bg-green-100 text-green-800";
    if (score >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Intelligence</h1>
          <p className="text-muted-foreground">
            Monitor competitor content, analyze trends, and generate briefs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: "Pipeline Info",
                description:
                  "The CI pipeline runs automatically on schedule. Use the settings page to configure thresholds.",
              })
            }
          >
            <Play className="h-4 w-4 mr-2" />
            Run Pipeline
          </Button>
          <Link href="/ci/competitors">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Competitor
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Analyses Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Analyses</CardTitle>
                  <CardDescription>Last 10 analyzed competitor videos</CardDescription>
                </div>
                <Link href="/ci/analyses">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {analysesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentAnalyses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No analyses yet. Add competitors and run the pipeline to get started.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Hook Type</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAnalyses.map((analysis) => (
                      <TableRow key={analysis.id}>
                        <TableCell className="font-medium">
                          {analysis.creator}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{analysis.topicCategory}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{analysis.hookType}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatViews(analysis.views)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getScoreColor(analysis.replicationScore)}>
                            {analysis.replicationScore}/5
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Latest Brief Summary */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Latest Brief</CardTitle>
                  <CardDescription>Most recent weekly brief</CardDescription>
                </div>
                <Link href="/ci/briefs">
                  <Button variant="ghost" size="sm">
                    All Briefs <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {briefLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : latestBrief ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">{latestBrief.weekLabel}</p>
                    <Badge variant={latestBrief.status === "complete" ? "default" : "secondary"}>
                      {latestBrief.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{latestBrief.videoCount}</p>
                      <p className="text-xs text-muted-foreground">Videos Analyzed</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{latestBrief.itemCount}</p>
                      <p className="text-xs text-muted-foreground">Brief Items</p>
                    </div>
                  </div>
                  {latestBrief.topTopics && latestBrief.topTopics.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Top Topics</p>
                      <div className="flex flex-wrap gap-1">
                        {latestBrief.topTopics.map((topic, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No briefs generated yet. Run the pipeline to create your first brief.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Navigation */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/ci/competitors">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Competitors
                </Button>
              </Link>
              <Link href="/ci/analyses">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analyses
                </Button>
              </Link>
              <Link href="/ci/briefs">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Content Briefs
                </Button>
              </Link>
              <Link href="/ci/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Play className="h-4 w-4 mr-2" />
                  CI Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
