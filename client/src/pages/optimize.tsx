import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TiptapEditor } from "@/components/tiptap-editor";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Globe,
  FileText,
  TrendingUp,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Lightbulb,
  BarChart3,
  Code,
  Heading,
  Calendar,
  History,
  Trash2,
  Eye,
  Save,
  RefreshCw,
  Wand2,
} from "lucide-react";

const DATE_RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "28", label: "Last 28 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
  { value: "180", label: "Last 6 months" },
  { value: "365", label: "Last 12 months" },
  { value: "540", label: "Last 16 months" },
];

const optimizeFormSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  targetKeyword: z.string().min(1, "Target keyword is required"),
  dateRange: z.string().default("28"),
});

type OptimizeFormData = z.infer<typeof optimizeFormSchema>;

interface KeywordData {
  keyword: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
}

interface CompetitorData {
  url: string;
  title: string;
  metaDescription: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  wordCount: number;
  content: string;
}

interface Recommendation {
  type: "title" | "meta" | "content" | "headings" | "keywords";
  priority: "high" | "medium" | "low";
  current: string;
  suggested: string;
  reason: string;
}

interface AnalysisResult {
  id?: string;
  keywords: KeywordData[];
  pageContent: {
    title: string;
    metaDescription: string;
    headings: {
      h1: string[];
      h2: string[];
      h3: string[];
    };
    wordCount: number;
    content: string;
    htmlContent?: string;
  };
  competitors: CompetitorData[];
  recommendations: Recommendation[];
}

interface SavedAnalysis {
  id: string;
  url: string;
  targetKeyword: string;
  dateRange: string | null;
  pageTitle: string | null;
  pageWordCount: number | null;
  createdAt: string;
  keywords: KeywordData[] | null;
  competitors: CompetitorData[] | null;
  recommendations: Recommendation[] | null;
  pageContent: AnalysisResult["pageContent"] | null;
}

export default function Optimize() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const [hasContentChanges, setHasContentChanges] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>("");
  const [selectedRecommendations, setSelectedRecommendations] = useState<number[]>([]);
  const [rewrittenContent, setRewrittenContent] = useState<string | null>(null);
  const [showRewriteEditor, setShowRewriteEditor] = useState(false);

  // Fetch saved analyses
  const { data: savedAnalyses = [], isLoading: loadingAnalyses } = useQuery<SavedAnalysis[]>({
    queryKey: ["/api/optimize/analyses"],
  });

  const form = useForm<OptimizeFormData>({
    resolver: zodResolver(optimizeFormSchema),
    defaultValues: {
      url: "",
      targetKeyword: "",
      dateRange: "28",
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: OptimizeFormData) => {
      const response = await apiRequest("POST", "/api/optimize/analyze", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setOriginalContent(data.pageContent?.htmlContent || "");
      setHasContentChanges(false);
      setAnalysisStep("");
      setSelectedRecommendations([]);
      setRewrittenContent(null);
      setShowRewriteEditor(false);
      queryClient.invalidateQueries({ queryKey: ["/api/optimize/analyses"] });
      toast({
        title: "Analysis Complete",
        description: "Your article has been analyzed and saved.",
      });
    },
    onError: (error: Error) => {
      setAnalysisStep("");
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/optimize/analyses/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/optimize/analyses"] });
      toast({
        title: "Deleted",
        description: "Analysis has been removed.",
      });
    },
  });

  const saveContentMutation = useMutation({
    mutationFn: async ({ id, htmlContent }: { id: string; htmlContent: string }) => {
      const response = await apiRequest("PATCH", `/api/optimize/analyses/${id}/content`, { htmlContent });
      return response.json();
    },
    onSuccess: () => {
      setHasContentChanges(false);
      setOriginalContent(analysisResult?.pageContent.htmlContent || "");
      queryClient.invalidateQueries({ queryKey: ["/api/optimize/analyses"] });
      toast({
        title: "Content Saved",
        description: "Your article content changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const refreshRecommendationsMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/optimize/analyses/${id}/refresh`);
      return response.json();
    },
    onSuccess: (data) => {
      if (analysisResult && data.recommendations) {
        setAnalysisResult({
          ...analysisResult,
          recommendations: data.recommendations,
        });
      }
      setSelectedRecommendations([]);
      queryClient.invalidateQueries({ queryKey: ["/api/optimize/analyses"] });
      toast({
        title: "Recommendations Refreshed",
        description: "AI analysis has been re-run with new recommendations.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const implementMutation = useMutation({
    mutationFn: async ({ content, recommendations }: { content: string; recommendations: Recommendation[] }) => {
      const response = await apiRequest("POST", `/api/optimize/implement`, {
        content,
        recommendations,
        targetKeyword: form.getValues("targetKeyword"),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setRewrittenContent(data.content);
      setShowRewriteEditor(true);
      toast({
        title: "Content Rewritten",
        description: "Your content has been updated with the selected recommendations.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Implementation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImplementRecommendations = () => {
    if (!analysisResult || selectedRecommendations.length === 0) return;
    
    const content = analysisResult.pageContent.htmlContent || analysisResult.pageContent.content;
    const recsToImplement = selectedRecommendations
      .map(i => analysisResult.recommendations[i])
      .filter(rec => rec !== undefined);
    
    if (recsToImplement.length === 0) return;
    
    implementMutation.mutate({ content, recommendations: recsToImplement });
  };

  const toggleRecommendation = (index: number) => {
    setSelectedRecommendations(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const selectAllRecommendations = () => {
    if (!analysisResult) return;
    if (selectedRecommendations.length === analysisResult.recommendations.length) {
      setSelectedRecommendations([]);
    } else {
      setSelectedRecommendations(analysisResult.recommendations.map((_, i) => i));
    }
  };

  const loadSavedAnalysis = (analysis: SavedAnalysis) => {
    const pageContent = analysis.pageContent || {
      title: analysis.pageTitle || "",
      metaDescription: "",
      headings: { h1: [], h2: [], h3: [] },
      wordCount: analysis.pageWordCount || 0,
      content: "",
    };
    setAnalysisResult({
      id: analysis.id,
      keywords: analysis.keywords || [],
      pageContent,
      competitors: analysis.competitors || [],
      recommendations: analysis.recommendations || [],
    });
    setOriginalContent(pageContent.htmlContent || "");
    setHasContentChanges(false);
    setSelectedRecommendations([]);
    setRewrittenContent(null);
    setShowRewriteEditor(false);
    form.setValue("url", analysis.url);
    form.setValue("targetKeyword", analysis.targetKeyword);
    form.setValue("dateRange", analysis.dateRange || "28");
    setShowHistory(false);
    toast({
      title: "Loaded",
      description: `Loaded analysis from ${new Date(analysis.createdAt).toLocaleDateString()}`,
    });
  };

  const onSubmit = (data: OptimizeFormData) => {
    setAnalysisResult(null);
    setAnalysisStep("Starting analysis...");
    analyzeMutation.mutate(data);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "title":
        return <FileText className="h-4 w-4" />;
      case "meta":
        return <Code className="h-4 w-4" />;
      case "content":
        return <FileText className="h-4 w-4" />;
      case "headings":
        return <Heading className="h-4 w-4" />;
      case "keywords":
        return <Target className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Article Optimizer
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze your content against top-ranking competitors and get AI-powered recommendations
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          data-testid="button-toggle-history"
        >
          <History className="h-4 w-4 mr-2" />
          {showHistory ? "Hide History" : "View History"}
          {savedAnalyses.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {savedAnalyses.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Saved Analyses History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Saved Analyses
            </CardTitle>
            <CardDescription>
              Load a previous analysis or delete old ones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAnalyses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedAnalyses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No saved analyses yet. Run an analysis to save it automatically.
              </p>
            ) : (
              <div className="space-y-2">
                {savedAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-md border hover-elevate"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" title={analysis.url}>
                        {analysis.pageTitle || analysis.url}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {analysis.targetKeyword}
                        </Badge>
                        <span>
                          {new Date(analysis.createdAt).toLocaleDateString()} at{" "}
                          {new Date(analysis.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {analysis.recommendations && (
                          <span>{(analysis.recommendations as Recommendation[]).length} recommendations</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => loadSavedAnalysis(analysis)}
                        data-testid={`button-load-${analysis.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Load
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(analysis.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${analysis.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Analyze Article
          </CardTitle>
          <CardDescription>
            Enter your article URL and target keyword to get optimization recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Article URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="https://www.psychicsource.com/article/..."
                            className="pl-10"
                            data-testid="input-url"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only psychicsource.com URLs are supported
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetKeyword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Keyword</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="e.g., psychic reading online"
                            className="pl-10"
                            data-testid="input-keyword"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="w-full md:w-48">
                    <FormLabel className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Keyword Data Range
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-date-range">
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DATE_RANGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Date range for GSC keyword rankings
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={analyzeMutation.isPending}
                data-testid="button-analyze"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {analysisStep || "Analyzing..."}
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analyze Article
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {analysisResult && (
        <Tabs defaultValue="recommendations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recommendations" data-testid="tab-recommendations">
              <Lightbulb className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="keywords" data-testid="tab-keywords">
              <Search className="h-4 w-4 mr-2" />
              Ranking Keywords
            </TabsTrigger>
            <TabsTrigger value="competitors" data-testid="tab-competitors">
              <BarChart3 className="h-4 w-4 mr-2" />
              Competitors
            </TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">
              <FileText className="h-4 w-4 mr-2" />
              Your Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Optimization Recommendations</CardTitle>
                  <CardDescription>
                    AI-powered suggestions to improve your ranking for "{form.getValues("targetKeyword")}"
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {analysisResult?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshRecommendationsMutation.mutate(analysisResult.id!)}
                      disabled={refreshRecommendationsMutation.isPending}
                      data-testid="button-refresh-recommendations"
                    >
                      {refreshRecommendationsMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </>
                      )}
                    </Button>
                  )}
                  {analysisResult.recommendations.length > 0 && (
                    <Button
                      size="sm"
                      onClick={handleImplementRecommendations}
                      disabled={selectedRecommendations.length === 0 || implementMutation.isPending}
                      data-testid="button-implement-recommendations"
                    >
                      {implementMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Rewriting...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Implement ({selectedRecommendations.length})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.recommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>Your content is well-optimized! No major improvements needed.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Checkbox
                          id="select-all"
                          checked={selectedRecommendations.length === analysisResult.recommendations.length}
                          onCheckedChange={selectAllRecommendations}
                          data-testid="checkbox-select-all"
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                          Select All ({analysisResult.recommendations.length} recommendations)
                        </label>
                      </div>
                      {analysisResult.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 space-y-3 transition-colors ${
                            selectedRecommendations.includes(index) ? 'border-primary bg-primary/5' : ''
                          }`}
                          data-testid={`recommendation-${index}`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={`rec-${index}`}
                                checked={selectedRecommendations.includes(index)}
                                onCheckedChange={() => toggleRecommendation(index)}
                                data-testid={`checkbox-recommendation-${index}`}
                              />
                              <div className="flex items-center gap-2">
                                {getTypeIcon(rec.type)}
                                <span className="font-medium capitalize">{rec.type}</span>
                              </div>
                            </div>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground ml-7">{rec.reason}</p>
                          {rec.current && (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-3 ml-7">
                              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                                Current:
                              </p>
                              <p className="text-sm">{rec.current}</p>
                            </div>
                          )}
                          {rec.suggested && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3 ml-7">
                              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                                Suggested:
                              </p>
                              <p className="text-sm">{rec.suggested}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {showRewriteEditor && rewrittenContent && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Rewritten Content</CardTitle>
                    <CardDescription>
                      Your content has been updated with the selected recommendations. Review and edit as needed.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowRewriteEditor(false);
                        setRewrittenContent(null);
                      }}
                      data-testid="button-discard-rewrite"
                    >
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (analysisResult && rewrittenContent) {
                          setAnalysisResult({
                            ...analysisResult,
                            pageContent: {
                              ...analysisResult.pageContent,
                              htmlContent: rewrittenContent,
                            },
                          });
                          setHasContentChanges(true);
                          setShowRewriteEditor(false);
                          setRewrittenContent(null);
                          setSelectedRecommendations([]);
                          toast({
                            title: "Content Applied",
                            description: "Rewritten content has been applied. Go to 'Your Content' tab to save it.",
                          });
                        }
                      }}
                      data-testid="button-apply-rewrite"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Apply Changes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg" style={{ height: "500px" }}>
                    <TiptapEditor
                      content={rewrittenContent}
                      editable={true}
                      onChange={(html) => setRewrittenContent(html)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Keywords Ranking for This URL</CardTitle>
                <CardDescription>
                  Data from Google Search Console showing keywords this page ranks for
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult.keywords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>No keyword data found for this URL.</p>
                    <p className="text-sm mt-2">
                      This may mean your GSC connection has expired. Try reconnecting in the Integrations page.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-4 py-2 text-sm font-medium text-muted-foreground border-b">
                      <div className="col-span-2">Keyword</div>
                      <div className="text-center">Position</div>
                      <div className="text-center">Clicks</div>
                      <div className="text-center">Impressions</div>
                    </div>
                    <ScrollArea className="h-[400px]">
                      {analysisResult.keywords.map((kw, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-5 gap-4 py-3 text-sm border-b last:border-0"
                          data-testid={`keyword-row-${index}`}
                        >
                          <div className="col-span-2 font-medium">{kw.keyword}</div>
                          <div className="text-center">
                            <Badge variant="outline">
                              {kw.position <= 3 ? (
                                <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                              ) : kw.position <= 10 ? (
                                <Minus className="h-3 w-3 mr-1 text-yellow-500" />
                              ) : (
                                <ArrowDown className="h-3 w-3 mr-1 text-red-500" />
                              )}
                              {kw.position.toFixed(1)}
                            </Badge>
                          </div>
                          <div className="text-center">{kw.clicks.toLocaleString()}</div>
                          <div className="text-center">{kw.impressions.toLocaleString()}</div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top-Ranking Competitors</CardTitle>
                <CardDescription>
                  Analysis of pages ranking on the first page for "{form.getValues("targetKeyword")}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult.competitors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>Could not fetch competitor data.</p>
                    <p className="text-sm mt-2">
                      Competitor analysis requires external access to search results.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysisResult.competitors.map((comp, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`competitor-${index}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <h3 className="font-medium truncate">{comp.title}</h3>
                            </div>
                            <a
                              href={comp.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
                            >
                              {new URL(comp.url).hostname}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <Badge variant="secondary">{comp.wordCount.toLocaleString()} words</Badge>
                        </div>

                        {comp.metaDescription && (
                          <div className="bg-muted/50 rounded-md p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Meta Description:
                            </p>
                            <p className="text-sm">{comp.metaDescription}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {comp.headings.h1.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">H1 Tags:</p>
                              <ul className="text-sm space-y-1">
                                {comp.headings.h1.slice(0, 2).map((h, i) => (
                                  <li key={i} className="truncate">
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {comp.headings.h2.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">H2 Tags:</p>
                              <ul className="text-sm space-y-1">
                                {comp.headings.h2.slice(0, 3).map((h, i) => (
                                  <li key={i} className="truncate">
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {comp.headings.h3.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">H3 Tags:</p>
                              <ul className="text-sm space-y-1">
                                {comp.headings.h3.slice(0, 3).map((h, i) => (
                                  <li key={i} className="truncate">
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {comp.content && (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full">
                                <FileText className="h-4 w-4 mr-2" />
                                View Full Content
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3">
                              <ScrollArea className="h-[400px] rounded-md border p-4">
                                <div className="text-sm text-muted-foreground whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                                  {comp.content}
                                </div>
                              </ScrollArea>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Your Content Analysis</CardTitle>
                  <CardDescription>Current state of your article - edit content directly below</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(form.getValues("url"), "_blank")}
                  data-testid="button-open-url"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open URL
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Word Count</p>
                    <p className="text-2xl font-semibold">
                      {analysisResult.pageContent.wordCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">H2 Headings</p>
                    <p className="text-2xl font-semibold">
                      {analysisResult.pageContent.headings.h2.length}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">H3 Headings</p>
                    <p className="text-2xl font-semibold">
                      {analysisResult.pageContent.headings.h3.length}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Title Tag</h4>
                  <p className="text-sm bg-muted/50 rounded-md p-3">
                    {analysisResult.pageContent.title || "No title found"}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Meta Description</h4>
                  <p className="text-sm bg-muted/50 rounded-md p-3">
                    {analysisResult.pageContent.metaDescription || "No meta description found"}
                  </p>
                </div>

                {analysisResult.pageContent.htmlContent ? (
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h4 className="font-medium">Article Content</h4>
                      <div className="flex items-center gap-2">
                        {hasContentChanges && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Unsaved changes
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            if (analysisResult?.id && analysisResult.pageContent.htmlContent) {
                              saveContentMutation.mutate({
                                id: analysisResult.id,
                                htmlContent: analysisResult.pageContent.htmlContent,
                              });
                            }
                          }}
                          disabled={!hasContentChanges || saveContentMutation.isPending || !analysisResult?.id}
                          data-testid="button-save-content"
                        >
                          {saveContentMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Content
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-lg" style={{ height: "500px" }}>
                      <TiptapEditor
                        content={analysisResult.pageContent.htmlContent}
                        editable={true}
                        onChange={(html) => {
                          setAnalysisResult(prev => prev ? {
                            ...prev,
                            pageContent: {
                              ...prev.pageContent,
                              htmlContent: html,
                            }
                          } : null);
                          if (!hasContentChanges && html !== originalContent) {
                            setHasContentChanges(true);
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : analysisResult.pageContent.content && (
                  <div>
                    <h4 className="font-medium mb-2">Content Preview</h4>
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {analysisResult.pageContent.content}
                      </p>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
