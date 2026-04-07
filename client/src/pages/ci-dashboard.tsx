import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Loader2, CheckCircle, Clock, AlertCircle, Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CiStats {
  competitors: number;
  videos: number;
  analyses: number;
  briefs: number;
}

interface PipelineStatus {
  scrape: string | null;
  transcripts: string | null;
  analyze: string | null;
  brief: string | null;
  scripts: string | null;
  performance: string | null;
}

export default function CiDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [runningStep, setRunningStep] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<CiStats>({
    queryKey: ["/api/ci/stats"],
  });

  const { data: pipelineStatus } = useQuery<PipelineStatus>({
    queryKey: ["/api/ci/pipeline/status"],
    refetchInterval: runningStep ? 5000 : 30000,
  });

  const { data: recentAnalyses = [] } = useQuery<any[]>({
    queryKey: ["/api/ci/analyses"],
    queryFn: async () => {
      const res = await fetch("/api/ci/analyses", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.slice(0, 10);
    },
  });

  const { data: latestBrief } = useQuery<any>({
    queryKey: ["/api/ci/briefs", "latest"],
    queryFn: async () => {
      const res = await fetch("/api/ci/briefs", { credentials: "include" });
      if (!res.ok) return null;
      const briefs = await res.json();
      return Array.isArray(briefs) && briefs.length > 0 ? briefs[0] : null;
    },
  });

  const runStepMutation = useMutation({
    mutationFn: async (step: string) => {
      const res = await apiRequest("POST", "/api/ci/pipeline/run-step", { step });
      return res.json();
    },
    onSuccess: (data: any, step) => {
      let desc = "";
      if (data.analyzed !== undefined) desc += `${data.analyzed} analyzed`;
      if (data.blocked) desc += `${desc ? ", " : ""}${data.blocked} blocked`;
      if (data.saved !== undefined) desc += `${data.saved} saved`;
      if (data.message) desc = data.message;
      if (!desc) desc = "Done";
      toast({ title: `${step} completed`, description: desc });
      queryClient.invalidateQueries({ queryKey: ["/api/ci"] });
      setRunningStep(null);
    },
    onError: (err: any, step) => {
      toast({ title: `${step} failed`, description: err.message, variant: "destructive" });
      setRunningStep(null);
    },
  });

  const runScriptsParallel = async () => {
    // Get latest brief to find how many items to generate
    const briefsRes = await fetch("/api/ci/briefs", { credentials: "include" });
    if (!briefsRes.ok) throw new Error("Failed to fetch briefs");
    const briefs = await briefsRes.json();
    const brief = Array.isArray(briefs) && briefs.length > 0 ? briefs[0] : null;
    if (!brief) throw new Error("No brief found");
    const items = Array.isArray(brief.briefData) ? brief.briefData : [];
    if (items.length === 0) throw new Error("Brief has no items");

    // Fire all script generation requests in parallel
    const results = await Promise.allSettled(
      items.map((_: any, i: number) =>
        apiRequest("POST", "/api/ci/pipeline/run-step", { step: "scripts", itemIndex: i }).then(r => r.json())
      )
    );
    const generated = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;
    return { generated, failed, total: items.length };
  };

  const runFullPipeline = async () => {
    const sequentialSteps = ["scrape", "transcripts", "analyze", "brief"];
    for (const step of sequentialSteps) {
      setRunningStep(step);
      try {
        await runStepMutation.mutateAsync(step);
      } catch {
        break;
      }
    }
    // Run scripts in parallel (like GitHub Actions)
    setRunningStep("scripts");
    try {
      const result = await runScriptsParallel();
      toast({ title: "scripts completed", description: `${result.generated} generated${result.failed ? `, ${result.failed} failed` : ""}` });
      queryClient.invalidateQueries({ queryKey: ["/api/ci"] });
    } catch (err: any) {
      toast({ title: "scripts failed", description: err.message, variant: "destructive" });
    }
    // Auto-convert scripts to video requests
    setRunningStep("convert");
    try {
      await runStepMutation.mutateAsync("convert");
    } catch {}
    setRunningStep(null);
    queryClient.invalidateQueries({ queryKey: ["/api/ci"] });
  };

  const runStep = (step: string) => {
    setRunningStep(step);
    if (step === "scripts") {
      runScriptsParallel()
        .then((result) => {
          toast({ title: "scripts completed", description: `${result.generated} generated${result.failed ? `, ${result.failed} failed` : ""}` });
          setRunningStep(null);
          queryClient.invalidateQueries({ queryKey: ["/api/ci"] });
        })
        .catch((err) => {
          toast({ title: "scripts failed", description: err.message, variant: "destructive" });
          setRunningStep(null);
        });
      return;
    }
    runStepMutation.mutate(step);
  };

  function formatTimestamp(ts: string | null): string {
    if (!ts) return "Never";
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  }

  function formatViews(views: number): string {
    if (!views) return "—";
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
    return String(views);
  }

  function getScoreColor(score: number): string {
    if (score >= 4) return "bg-green-100 text-green-800";
    if (score >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  }

  const pipelineSteps = [
    { key: "scrape", label: "Scrape + Transcripts", description: "Pull videos and transcripts" },
    { key: "analyze", label: "Analyze", description: "AI analyze each video" },
    { key: "brief", label: "Brief", description: "Generate content brief" },
    { key: "scripts", label: "Scripts", description: "Write full scripts" },
    { key: "performance", label: "Performance", description: "Weekly feedback (Mon)" },
  ];

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
            onClick={runFullPipeline}
            disabled={!!runningStep}
          >
            {runningStep ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {runningStep ? `Running ${runningStep}...` : "Run Full Pipeline"}
          </Button>
          <Link href="/ci/competitors">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Competitor
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Competitors", value: stats?.competitors ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Videos Scraped", value: stats?.videos ?? 0, icon: Video, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Analyses", value: stats?.analyses ?? 0, icon: BarChart3, color: "text-green-600", bg: "bg-green-50" },
          { title: "Briefs", value: stats?.briefs ?? 0, icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
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

      {/* Pipeline Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Steps</CardTitle>
          <CardDescription>Run individual steps or the full pipeline. Daily automation runs at 5:00 AM ET.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pipelineSteps.map((step) => {
              const lastRun = pipelineStatus?.[step.key as keyof PipelineStatus];
              const isRunning = runningStep === step.key;
              return (
                <div key={step.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {lastRun ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm">{step.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">{step.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                      Last run: {formatTimestamp(lastRun || null)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runStep(step.key)}
                    disabled={!!runningStep}
                  >
                    {isRunning ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Analyses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Analyses</CardTitle>
                <Link href="/ci/analyses">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentAnalyses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No analyses yet. Add competitors and run the pipeline.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Hook</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAnalyses.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.creator ? `@${a.creator}` : "—"}</TableCell>
                        <TableCell><Badge variant="outline">{a.topicCategory}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{a.hookType}</Badge></TableCell>
                        <TableCell className="text-right">{formatViews(a.views)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getScoreColor(a.replicationScore)}>{a.replicationScore}/5</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Latest Brief + Quick Links */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Latest Brief</CardTitle>
                <Link href="/ci/briefs">
                  <Button variant="ghost" size="sm">All <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {latestBrief ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{latestBrief.weekLabel}</p>
                    <Badge>{latestBrief.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <p className="text-xl font-bold">{latestBrief.videoCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Videos</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <p className="text-xl font-bold">{Array.isArray(latestBrief.briefData) ? latestBrief.briefData.length : 0}</p>
                      <p className="text-xs text-muted-foreground">Briefs</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No briefs yet. Run the pipeline.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quick Links</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Link href="/ci/competitors"><Button variant="outline" className="w-full justify-start"><Users className="h-4 w-4 mr-2" />Competitors</Button></Link>
              <Link href="/ci/analyses"><Button variant="outline" className="w-full justify-start"><BarChart3 className="h-4 w-4 mr-2" />Analyses</Button></Link>
              <Link href="/ci/briefs"><Button variant="outline" className="w-full justify-start"><FileText className="h-4 w-4 mr-2" />Briefs</Button></Link>
              <Link href="/ci/settings"><Button variant="outline" className="w-full justify-start"><Play className="h-4 w-4 mr-2" />Settings</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
