import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft, ChevronDown, ChevronRight, FileText, Sparkles, Loader2,
  ArrowRightCircle, ScrollText, Video, Play, CheckCircle, Clock,
} from "lucide-react";
import { Link } from "wouter";

interface BriefItem {
  title: string;
  topic_description: string;
  hook_options: string[];
  talking_points: string[];
}

interface Brief {
  id: number;
  weekLabel: string;
  videoCount: number;
  status: string;
  topTopics: string[];
  items: BriefItem[];
  createdAt: string;
}

interface Script {
  id: number;
  briefId: number;
  itemIndex: number;
  title: string;
  script: string;
  status: string;
  createdAt: string;
}

export default function CiBriefs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedBriefs, setExpandedBriefs] = useState<Set<number>>(new Set());
  const [selectedBriefId, setSelectedBriefId] = useState<number | null>(null);
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

  const { data: briefs = [], isLoading } = useQuery<Brief[]>({
    queryKey: ["/api/ci/briefs"],
  });

  const { data: scripts = [], isLoading: scriptsLoading } = useQuery<Script[]>({
    queryKey: ["/api/ci/scripts", selectedBriefId],
    queryFn: async () => {
      if (!selectedBriefId) return [];
      const res = await fetch(`/api/ci/scripts?briefId=${selectedBriefId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scripts");
      return res.json();
    },
    enabled: !!selectedBriefId,
  });

  const generateScriptMutation = useMutation({
    mutationFn: async ({ briefId, itemIndex }: { briefId: number; itemIndex: number }) => {
      const res = await apiRequest("POST", "/api/ci/pipeline/generate-script", {
        briefId,
        itemIndex,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ci/scripts", variables.briefId] });
      toast({ title: "Script generated", description: "The script has been generated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to generate script", description: err.message, variant: "destructive" });
    },
  });

  const convertToVideoRequestMutation = useMutation({
    mutationFn: async (scriptId: number) => {
      const res = await apiRequest("POST", `/api/ci/scripts/${scriptId}/convert`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ci/scripts"] });
      toast({ title: "Converted to video request", description: "A new video request has been created from this script." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to convert", description: err.message, variant: "destructive" });
    },
  });

  function toggleBrief(id: number) {
    setExpandedBriefs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (selectedBriefId === id) setSelectedBriefId(null);
      } else {
        next.add(id);
        setSelectedBriefId(id);
      }
      return next;
    });
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getStatusColor(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "complete": return "default";
      case "generating": return "secondary";
      case "error": return "destructive";
      default: return "outline";
    }
  }

  function getScriptForItem(briefId: number, itemIndex: number): Script | undefined {
    if (selectedBriefId !== briefId) return undefined;
    return scripts.find((s) => s.briefId === briefId && s.itemIndex === itemIndex);
  }

  // Sort briefs newest first
  const sortedBriefs = [...briefs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
            <h1 className="text-3xl font-bold tracking-tight">Content Briefs</h1>
            <p className="text-muted-foreground">
              Weekly content briefs generated from competitor analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
            {pipelineStatus?.brief ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
            Brief: {formatTimestamp(pipelineStatus?.brief)}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
            {pipelineStatus?.scripts ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
            Scripts: {formatTimestamp(pipelineStatus?.scripts)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setRunningStep("brief"); runStepMutation.mutate("brief"); }}
            disabled={!!runningStep}
          >
            {runningStep === "brief" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
            Run Brief
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setRunningStep("scripts"); runStepMutation.mutate("scripts"); }}
            disabled={!!runningStep}
          >
            {runningStep === "scripts" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
            Run Scripts
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedBriefs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Briefs Yet</h3>
              <p className="text-muted-foreground mb-4">
                Run the content intelligence pipeline to generate your first weekly brief.
              </p>
              <Link href="/ci">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedBriefs.map((brief) => (
            <Collapsible
              key={brief.id}
              open={expandedBriefs.has(brief.id)}
              onOpenChange={() => toggleBrief(brief.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedBriefs.has(brief.id) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{brief.weekLabel}</CardTitle>
                          <CardDescription>
                            {brief.videoCount} videos analyzed -- {formatDate(brief.createdAt)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusColor(brief.status)}>{brief.status}</Badge>
                        {brief.topTopics && brief.topTopics.length > 0 && (
                          <div className="hidden sm:flex gap-1">
                            {brief.topTopics.slice(0, 3).map((topic, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                            {brief.topTopics.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{brief.topTopics.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-6">
                    <Separator />

                    {/* Brief Items */}
                    {brief.items && brief.items.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Brief Items ({brief.items.length})
                        </h3>
                        {brief.items.map((item, index) => {
                          const existingScript = getScriptForItem(brief.id, index);
                          return (
                            <Card key={index} className="border-dashed">
                              <CardContent className="pt-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {item.topic_description}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={existingScript ? "outline" : "default"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      generateScriptMutation.mutate({
                                        briefId: brief.id,
                                        itemIndex: index,
                                      });
                                    }}
                                    disabled={generateScriptMutation.isPending}
                                  >
                                    {generateScriptMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                      <Sparkles className="h-4 w-4 mr-1" />
                                    )}
                                    {existingScript ? "Regenerate" : "Generate Script"}
                                  </Button>
                                </div>

                                {item.hook_options && item.hook_options.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                      Hook Options
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {item.hook_options.map((hook, hi) => (
                                        <li key={hi} className="text-sm">
                                          {hook}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {item.talking_points && item.talking_points.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                      Talking Points
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                      {item.talking_points.map((point, pi) => (
                                        <li key={pi} className="text-sm">
                                          {point}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {existingScript && (
                                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                        <ScrollText className="h-3 w-3" />
                                        Generated Script
                                      </p>
                                      <Badge variant="outline" className="text-xs">
                                        {existingScript.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap line-clamp-6">
                                      {existingScript.script}
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No brief items available.
                      </p>
                    )}

                    {/* Scripts Section */}
                    {selectedBriefId === brief.id && scripts.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Generated Scripts ({scripts.length})
                          </h3>
                          {scriptsLoading ? (
                            <div className="space-y-3">
                              {[1, 2].map((i) => (
                                <Skeleton key={i} className="h-24 w-full" />
                              ))}
                            </div>
                          ) : (
                            scripts.map((script) => (
                              <Card key={script.id}>
                                <CardContent className="pt-4 space-y-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <h4 className="font-semibold">{script.title}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        Item #{script.itemIndex + 1} -- {formatDate(script.createdAt)}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">{script.status}</Badge>
                                      <Button
                                        size="sm"
                                        onClick={() => convertToVideoRequestMutation.mutate(script.id)}
                                        disabled={convertToVideoRequestMutation.isPending}
                                      >
                                        {convertToVideoRequestMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        ) : (
                                          <Video className="h-4 w-4 mr-1" />
                                        )}
                                        Convert to Video Request
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">{script.script}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
