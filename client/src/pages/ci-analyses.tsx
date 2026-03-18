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
import { ArrowLeft, ChevronDown, ChevronRight, BarChart3, Filter, Play, Loader2, CheckCircle, Clock, Trash2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Analysis {
  id: number;
  videoId: number;
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
}

interface CiVideo {
  id: number;
  competitorId: number;
  platformVideoId: string;
  creatorHandle: string;
  views: number;
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

  const { data: videos = [] } = useQuery<CiVideo[]>({
    queryKey: ["/api/ci/videos"],
  });

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

      {/* Filters */}
      <Card>
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
      ) : analyses.length === 0 ? (
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
              {analyses.length} {analyses.length === 1 ? "Analysis" : "Analyses"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Topic Category</TableHead>
                  <TableHead>Hook Type</TableHead>
                  <TableHead>Emotional Angle</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <Collapsible key={analysis.id} open={expandedRows.has(analysis.id)} asChild>
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleRow(analysis.id)}
                        >
                          <TableCell>
                            {expandedRows.has(analysis.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{analysis.creator ? `@${analysis.creator}` : "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{analysis.topicCategory}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{analysis.hookType}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{analysis.emotionalAngle}</TableCell>
                          <TableCell className="text-right">{analysis.views ? formatViews(analysis.views) : "—"}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={getScoreColor(analysis.replicationScore)}>
                              {analysis.replicationScore}/5
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatLabel(analysis.format || "")}</TableCell>
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
                          <TableCell colSpan={9}>
                            <div className="py-4 px-2 space-y-4">
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
    </div>
  );
}
