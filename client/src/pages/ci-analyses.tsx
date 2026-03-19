import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ChevronDown, ChevronRight, BarChart3, Filter, Play, Loader2, CheckCircle, Clock, Trash2, ExternalLink, FileText, RotateCcw, Ban, AlertTriangle, Video } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Analysis {
  id: number;
  videoId: number;
  scrapedVideoId: string;
  blocked: boolean;
  blockReason: string | null;
  topicCategory: string;
  topicSummary: string;
  hookType: string;
  hookText: string;
  hookSummary: string;
  emotionalAngle: string;
  targetAudience: string;
  ctaType: string;
  format: string;
  views: number;
  replicationScore: number;
  notes: string | null;
  creator: string;
  videoUrl: string | null;
  likes: number;
  shares: number;
  comments: number;
  postedAt: string | null;
  transcriptPreview: string | null;
  transcript: string | null;
  platform: string;
}

interface CiVideo {
  id: string;
  competitorId: string;
  externalVideoId: string;
  url: string;
  caption: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  duration: number | null;
  postedAt: string | null;
  transcript: string | null;
  transcriptStatus: string;
  analysisStatus: string;
  scrapedAt: string;
}

interface Competitor {
  id: string;
  handle: string;
  displayName: string | null;
  platform: string;
}

const SCORE_OPTIONS = [
  { value: "0", label: "All Scores" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5 only" },
];

function formatLabel(value: string): string {
  // If already has spaces/proper case, return as-is
  if (value.includes(" ") || value.includes("&")) return value;
  // Otherwise convert snake_case to Title Case
  return value.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function CiAnalyses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [topicFilter, setTopicFilter] = useState("all");
  const [hookFilter, setHookFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("0");
  const [runningStep, setRunningStep] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("analyses");

  const { data: pipelineStatus } = useQuery<Record<string, string | null>>({
    queryKey: ["/api/ci/pipeline/status"],
  });

  const runStepMutation = useMutation({
    mutationFn: async (step: string) => {
      const res = await apiRequest("POST", "/api/ci/pipeline/run-step", { step });
      return res.json();
    },
    onSuccess: (_data, step) => {
      toast({ title: `${step} completed` });
      queryClient.invalidateQueries({ queryKey: ["/api/ci"] });
      setRunningStep(null);
    },
    onError: (err: Error, step) => {
      toast({ title: `${step} failed`, description: err.message, variant: "destructive" });
      setRunningStep(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ci/analyses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ci"] });
      toast({ title: "Analysis deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const retryTranscriptMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const res = await apiRequest("POST", `/api/ci/videos/${videoId}/retry-transcript`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ci"] });
      toast({ title: "Transcript queued for retry" });
    },
    onError: (err: Error) => {
      toast({ title: "Retry failed", description: err.message, variant: "destructive" });
    },
  });

  function formatTimestamp(ts: string | null | undefined): string {
    if (!ts) return "Never";
    const d = new Date(ts);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }

  // Load dynamic filter options from CI settings
  const { data: settings } = useQuery<Array<{ key: string; value: string }>>({
    queryKey: ["/api/ci/settings"],
  });

  const TOPIC_CATEGORIES = (() => {
    const setting = settings?.find(s => s.key === "topic_categories");
    if (setting) {
      try {
        const items: string[] = JSON.parse(setting.value);
        return [{ value: "all", label: "All Topics" }, ...items.map(v => ({ value: v, label: formatLabel(v) }))];
      } catch {}
    }
    return [{ value: "all", label: "All Topics" }];
  })();

  const HOOK_TYPES = (() => {
    const setting = settings?.find(s => s.key === "hook_types");
    if (setting) {
      try {
        const items: string[] = JSON.parse(setting.value);
        return [{ value: "all", label: "All Hook Types" }, ...items.map(v => ({ value: v, label: formatLabel(v) }))];
      } catch {}
    }
    return [{ value: "all", label: "All Hook Types" }];
  })();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Build query params
  const queryParams = new URLSearchParams();
  if (hookFilter !== "all") queryParams.set("hookType", hookFilter);
  if (topicFilter !== "all") queryParams.set("topicCategory", topicFilter);
  if (scoreFilter !== "0") queryParams.set("minReplicationScore", scoreFilter);
  const queryString = queryParams.toString();

  const { data: analyses = [], isLoading } = useQuery<Analysis[]>({
    queryKey: ["/api/ci/analyses", queryString],
    queryFn: async () => {
      const url = queryString ? `/api/ci/analyses?${queryString}` : "/api/ci/analyses";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analyses");
      return res.json();
    },
  });

  // Fetch all videos for the All Videos tab
  const { data: allVideos = [], isLoading: isLoadingVideos } = useQuery<CiVideo[]>({
    queryKey: ["/api/ci/videos/all"],
    queryFn: async () => {
      const res = await fetch("/api/ci/videos", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch videos");
      return res.json();
    },
  });

  // Fetch competitors for joining with videos
  const { data: competitors = [] } = useQuery<Competitor[]>({
    queryKey: ["/api/ci/competitors"],
  });

  const competitorMap = new Map(competitors.map(c => [c.id, c]));

  // Sort analyses: non-blocked first, blocked at the bottom
  const sortedAnalyses = [...analyses].sort((a, b) => {
    if (a.blocked && !b.blocked) return 1;
    if (!a.blocked && b.blocked) return -1;
    return 0;
  });

  // Compute stats
  const totalVideos = allVideos.length;
  const analyzedCount = allVideos.filter(v => v.analysisStatus === "completed").length;
  const pendingCount = allVideos.filter(v => v.analysisStatus === "pending" && v.transcriptStatus !== "failed").length;
  const blockedCount = allVideos.filter(v => v.analysisStatus === "blocked").length;
  const failedTranscriptCount = allVideos.filter(v => v.transcriptStatus === "failed").length;

  function toggleRow(id: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

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

  function clearFilters() {
    setTopicFilter("all");
    setHookFilter("all");
    setScoreFilter("0");
  }

  function getTranscriptBadge(status: string, url?: string) {
    const isPhoto = url?.includes("/photo/");
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "failed":
        return (
          <div className="flex flex-col gap-0.5">
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
            <span className="text-[10px] text-muted-foreground">{isPhoto ? "Photo post — no audio" : "No transcript available"}</span>
          </div>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getAnalysisBadge(status: string) {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✓ Analyzed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "blocked":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  const hasActiveFilters = topicFilter !== "all" || hookFilter !== "all" || scoreFilter !== "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/ci">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analyses</h1>
            <p className="text-muted-foreground">Browse and filter analyzed competitor videos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
            {pipelineStatus?.analyze ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
            Analyze: {formatTimestamp(pipelineStatus?.analyze)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setRunningStep("analyze"); runStepMutation.mutate("analyze"); }}
            disabled={!!runningStep}
          >
            {runningStep === "analyze" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
            Run Analyze
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
          )}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="flex items-center gap-3 flex-wrap text-sm">
        <div className="flex items-center gap-1.5">
          <Video className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{totalVideos}</span>
          <span className="text-muted-foreground">scraped</span>
        </div>
        <span className="text-muted-foreground">--</span>
        <div className="flex items-center gap-1.5">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">{analyzedCount}</Badge>
          <span className="text-muted-foreground">analyzed</span>
        </div>
        <span className="text-muted-foreground">--</span>
        <div className="flex items-center gap-1.5">
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">{pendingCount}</Badge>
          <span className="text-muted-foreground">pending</span>
        </div>
        <span className="text-muted-foreground">--</span>
        <div className="flex items-center gap-1.5">
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">{blockedCount}</Badge>
          <span className="text-muted-foreground">blocked</span>
        </div>
        <span className="text-muted-foreground">--</span>
        <div className="flex items-center gap-1.5">
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-xs">{failedTranscriptCount}</Badge>
          <span className="text-muted-foreground">failed transcripts</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="analyses">Analyses</TabsTrigger>
          <TabsTrigger value="all-videos">All Videos</TabsTrigger>
        </TabsList>

        {/* ======== ANALYSES TAB ======== */}
        <TabsContent value="analyses">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Topic Category</label>
                  <Select value={topicFilter} onValueChange={setTopicFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOPIC_CATEGORIES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Hook Type</label>
                  <Select value={hookFilter} onValueChange={setHookFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOOK_TYPES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Min Replication Score</label>
                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCORE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analyses Table */}
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : sortedAnalyses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analyses Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {hasActiveFilters
                      ? "No analyses match your current filters. Try adjusting them."
                      : "No videos have been analyzed yet. Run the pipeline to start analyzing competitor content."}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {sortedAnalyses.length} {sortedAnalyses.length === 1 ? "Analysis" : "Analyses"}
                  {sortedAnalyses.some(a => a.blocked) && (
                    <span className="text-muted-foreground font-normal text-sm ml-2">
                      (including {sortedAnalyses.filter(a => a.blocked).length} blocked)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Post Date</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Topic Category</TableHead>
                      <TableHead>Hook Type</TableHead>
                      <TableHead>Emotional Angle</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-center">Replication Score</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAnalyses.map((analysis) => (
                      <Collapsible key={analysis.id} open={expandedRows.has(analysis.id)} asChild>
                        <>
                          <CollapsibleTrigger asChild>
                            <TableRow
                              className={`cursor-pointer hover:bg-muted/50 ${analysis.blocked ? "opacity-60" : ""}`}
                              onClick={() => toggleRow(analysis.id)}
                            >
                              <TableCell>
                                {expandedRows.has(analysis.id) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell>
                                {analysis.blocked ? (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-[10px] px-1.5">Blocked</Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] px-1.5">✓</Badge>
                                )}
                              </TableCell>
                              <TableCell className={`text-sm ${analysis.blocked ? "text-muted-foreground" : ""}`}>
                                {analysis.postedAt ? new Date(analysis.postedAt).toLocaleDateString() : "\u2014"}
                              </TableCell>
                              <TableCell className={`font-medium ${analysis.blocked ? "text-muted-foreground" : ""}`}>
                                {analysis.creator ? `@${analysis.creator}` : "\u2014"}
                              </TableCell>
                              <TableCell className={`text-sm capitalize ${analysis.blocked ? "text-muted-foreground" : ""}`}>
                                {analysis.platform || "\u2014"}
                              </TableCell>
                              <TableCell>
                                {analysis.blocked ? (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                    <Ban className="h-3 w-3 mr-1" />
                                    BLOCKED
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">{analysis.topicCategory}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {analysis.blocked ? (
                                  <span className="text-xs text-muted-foreground italic truncate max-w-[200px] block">
                                    {analysis.blockReason || "Restricted topic"}
                                  </span>
                                ) : (
                                  <Badge variant="secondary">{analysis.hookType}</Badge>
                                )}
                              </TableCell>
                              <TableCell className={`text-sm ${analysis.blocked ? "text-muted-foreground" : ""}`}>
                                {analysis.blocked ? "\u2014" : analysis.emotionalAngle}
                              </TableCell>
                              <TableCell className={`text-right ${analysis.blocked ? "text-muted-foreground" : ""}`}>
                                {analysis.views ? formatViews(analysis.views) : "\u2014"}
                              </TableCell>
                              <TableCell className="text-center">
                                {analysis.blocked ? (
                                  <span className="text-muted-foreground">\u2014</span>
                                ) : (
                                  <Badge className={getScoreColor(analysis.replicationScore)}>
                                    {analysis.replicationScore}/5
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className={`text-sm ${analysis.blocked ? "text-muted-foreground" : ""}`}>
                                {analysis.blocked ? "\u2014" : formatLabel(analysis.format || "")}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {analysis.videoUrl && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(analysis.videoUrl!, "_blank");
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("Are you sure?")) deleteMutation.mutate(String(analysis.id));
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={12}>
                                <div className="py-4 px-2 space-y-4">
                                  {analysis.blocked ? (
                                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="font-medium text-red-800 dark:text-red-300 mb-1">Blocked Content</p>
                                        <p className="text-sm text-red-700 dark:text-red-400">
                                          {analysis.blockReason || "This video was flagged as containing restricted content."}
                                        </p>
                                        {analysis.topicCategory && (
                                          <p className="text-xs text-muted-foreground mt-2">
                                            Detected topic: {analysis.topicCategory}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Topic Summary
                                          </p>
                                          <p className="text-sm">{analysis.topicSummary}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Hook Text
                                          </p>
                                          <p className="text-sm italic">"{analysis.hookText}"</p>
                                        </div>
                                      </div>
                                      <Separator />
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Hook Summary
                                          </p>
                                          <p className="text-sm">{analysis.hookSummary}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Target Audience
                                          </p>
                                          <p className="text-sm">{analysis.targetAudience}</p>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-1">
                                            CTA Type
                                          </p>
                                          <Badge variant="outline">{analysis.ctaType}</Badge>
                                        </div>
                                        {analysis.notes && (
                                          <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                              Notes
                                            </p>
                                            <p className="text-sm text-muted-foreground">{analysis.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                      <Separator />
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Likes</p>
                                          <p className="text-lg font-semibold">{formatViews(analysis.likes)}</p>
                                        </div>
                                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Shares</p>
                                          <p className="text-lg font-semibold">{formatViews(analysis.shares)}</p>
                                        </div>
                                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Comments</p>
                                          <p className="text-lg font-semibold">{formatViews(analysis.comments)}</p>
                                        </div>
                                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Post Date</p>
                                          <p className="text-sm font-semibold">
                                            {analysis.postedAt
                                              ? new Date(analysis.postedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                              : "Unknown"}
                                          </p>
                                        </div>
                                      </div>
                                      {analysis.transcript && (
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                              <FileText className="h-4 w-4 mr-1" />
                                              View Transcript
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-2xl max-h-[80vh]">
                                            <DialogHeader>
                                              <DialogTitle>Video Transcript -- @{analysis.creator}</DialogTitle>
                                            </DialogHeader>
                                            <ScrollArea className="max-h-[60vh]">
                                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{analysis.transcript}</p>
                                            </ScrollArea>
                                          </DialogContent>
                                        </Dialog>
                                      )}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ======== ALL VIDEOS TAB ======== */}
        <TabsContent value="all-videos">
          {isLoadingVideos ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : allVideos.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Videos Scraped</h3>
                  <p className="text-muted-foreground">
                    Run the scrape pipeline to start collecting competitor videos.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {allVideos.length} {allVideos.length === 1 ? "Video" : "Videos"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Post Date</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Caption</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead>Transcript Status</TableHead>
                      <TableHead>Analysis Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allVideos.map((video) => {
                      const comp = competitorMap.get(video.competitorId);
                      return (
                        <TableRow key={video.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {video.postedAt ? new Date(video.postedAt).toLocaleDateString() : "\u2014"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {comp ? `@${comp.handle}` : "\u2014"}
                          </TableCell>
                          <TableCell className="text-sm max-w-[250px]">
                            <span className="truncate block" title={video.caption || ""}>
                              {video.caption ? (video.caption.length > 60 ? video.caption.substring(0, 60) + "..." : video.caption) : "\u2014"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {video.viewCount ? formatViews(video.viewCount) : "\u2014"}
                          </TableCell>
                          <TableCell>
                            {getTranscriptBadge(video.transcriptStatus, video.url)}
                          </TableCell>
                          <TableCell>
                            {getAnalysisBadge(video.analysisStatus)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {video.transcriptStatus === "failed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  title="Retry transcript"
                                  onClick={() => retryTranscriptMutation.mutate(video.id)}
                                  disabled={retryTranscriptMutation.isPending}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                              {video.url && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  title="Open video"
                                  onClick={() => window.open(video.url, "_blank")}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
