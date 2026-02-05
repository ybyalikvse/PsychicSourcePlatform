import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { ImageStyle, OptimizationPrompt } from "@shared/schema";
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
  ImageIcon,
  Plus,
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
  const [quickFetchResult, setQuickFetchResult] = useState<AnalysisResult | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const [hasContentChanges, setHasContentChanges] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>("");
  const [selectedRecommendations, setSelectedRecommendations] = useState<number[]>([]);
  const [rewrittenContent, setRewrittenContent] = useState<string | null>(null);
  const [showRewriteEditor, setShowRewriteEditor] = useState(false);
  
  // Image generation states
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageProvider, setImageProvider] = useState<"gemini" | "openai">("gemini");
  const [selectedImageStyleId, setSelectedImageStyleId] = useState<string>("default");
  const [imageAspectRatio, setImageAspectRatio] = useState("16:9");

  // Fetch saved analyses
  const { data: savedAnalyses = [], isLoading: loadingAnalyses } = useQuery<SavedAnalysis[]>({
    queryKey: ["/api/optimize/analyses"],
  });

  // Fetch image styles
  const { data: imageStyles = [] } = useQuery<ImageStyle[]>({
    queryKey: ["/api/image-styles"],
  });

  // Fetch optimization prompts
  const { data: optimizationPrompts = [] } = useQuery<OptimizationPrompt[]>({
    queryKey: ["/api/optimization-prompts"],
  });

  // State for selected optimization prompt (for analysis-type prompts only)
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  // Filter prompts by type
  const analysisPrompts = optimizationPrompts.filter(p => p.promptType !== "direct");
  const directPrompts = optimizationPrompts.filter(p => p.promptType === "direct");

  // Debug state - shows what gets sent to AI
  const [debugInfo, setDebugInfo] = useState<{
    promptName: string;
    promptText: string;
    promptId: string;
    targetKeyword: string;
    recommendationsCount: number;
    recommendations: string;
    contentLength: number;
    timestamp: string;
    selectedPromptIdState: string;
    optimizationPromptsCount: number;
    processedPrompt?: string; // Actual prompt sent to AI (after placeholder replacement)
  } | null>(null);

  // Get the default prompt or first one (from analysis prompts only)
  const getSelectedPrompt = () => {
    if (selectedPromptId) {
      return analysisPrompts.find(p => p.id.toString() === selectedPromptId);
    }
    return analysisPrompts.find(p => p.isDefault) || analysisPrompts[0];
  };

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
      setQuickFetchResult(null); // Clear quick fetch when full analysis completes
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
    mutationFn: async ({ content, recommendations, promptId }: { content: string; recommendations: Recommendation[]; promptId?: string }) => {
      const response = await apiRequest("POST", `/api/optimize/implement`, {
        content,
        recommendations,
        targetKeyword: form.getValues("targetKeyword"),
        promptId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setRewrittenContent(data.content);
      setShowRewriteEditor(true);
      // Update debug info with the actual processed prompt from the API
      if (data.processedPrompt && debugInfo) {
        setDebugInfo(prev => prev ? { ...prev, processedPrompt: data.processedPrompt } : null);
      }
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

  // Direct Apply mutation - applies a direct prompt without requiring analysis
  const directApplyMutation = useMutation({
    mutationFn: async ({ content, promptId, targetKeyword }: { content: string; promptId: string; targetKeyword: string }) => {
      const response = await apiRequest("POST", `/api/optimize/direct-apply`, {
        content,
        promptId,
        targetKeyword,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setRewrittenContent(data.content);
      setShowRewriteEditor(true);
      toast({
        title: "Content Updated",
        description: "The direct prompt has been applied to your content.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Quick Fetch mutation - only scrapes page content without full analysis
  const quickFetchMutation = useMutation({
    mutationFn: async (data: OptimizeFormData) => {
      const response = await apiRequest("POST", "/api/optimize/quick-fetch", {
        url: data.url,
        targetKeyword: data.targetKeyword,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQuickFetchResult(data);
      setAnalysisResult(null); // Clear any previous full analysis
      setRewrittenContent(null);
      setShowRewriteEditor(false);
      toast({
        title: "Page Loaded",
        description: "Content is ready. Choose a quick action below.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Quick Fetch Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImplementRecommendations = () => {
    if (!analysisResult) return;
    
    const content = analysisResult.pageContent.htmlContent || analysisResult.pageContent.content;
    const recsToImplement = selectedRecommendations
      .map(i => analysisResult.recommendations[i])
      .filter(rec => rec !== undefined);
    
    const selectedPrompt = getSelectedPrompt();
    
    // Set debug info for UI display
    setDebugInfo({
      promptName: selectedPrompt?.name || "(No prompt found - using default)",
      promptText: selectedPrompt?.prompt || "(Using default optimization prompt)",
      promptId: selectedPrompt?.id ? String(selectedPrompt.id) : "null/undefined",
      targetKeyword: form.getValues("targetKeyword"),
      recommendationsCount: recsToImplement.length,
      recommendations: recsToImplement.length > 0 
        ? recsToImplement.map((rec, i) => 
            `${i + 1}. [${rec.type.toUpperCase()}] ${rec.priority} priority\n   Reason: ${rec.reason}\n   ${rec.current ? `Current: ${rec.current}` : ""}\n   Suggested: ${rec.suggested}`
          ).join("\n\n")
        : "(No recommendations selected)",
      contentLength: content.length,
      timestamp: new Date().toLocaleTimeString(),
      selectedPromptIdState: selectedPromptId || "null",
      optimizationPromptsCount: optimizationPrompts.length,
    });
    
    implementMutation.mutate({ 
      content, 
      recommendations: recsToImplement,
      promptId: selectedPrompt?.id ? String(selectedPrompt.id) : undefined,
    });
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

  // Handler for applying direct prompts without analysis
  const handleDirectApply = (promptId: string) => {
    if (!analysisResult?.pageContent) {
      toast({
        title: "No Content Available",
        description: "Please analyze a page first to get the content.",
        variant: "destructive",
      });
      return;
    }
    
    const content = analysisResult.pageContent.htmlContent || analysisResult.pageContent.content;
    const targetKeyword = form.getValues("targetKeyword");
    
    directApplyMutation.mutate({ content, promptId, targetKeyword });
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter an image prompt.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await apiRequest("POST", "/api/images/generate", {
        prompt: imagePrompt.trim(),
        styleId: selectedImageStyleId !== "default" ? selectedImageStyleId : undefined,
        imageType: "inline",
        provider: imageProvider,
        aspectRatio: imageAspectRatio,
      });
      const data = await response.json();
      setGeneratedImageUrl(data.imageUrl);
      const providerName = imageProvider === "openai" ? "OpenAI" : "Gemini";
      toast({
        title: "Image Generated",
        description: `Successfully generated image using ${providerName}.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleInsertImageIntoContent = () => {
    if (!generatedImageUrl || !rewrittenContent) return;
    
    const imageHtml = `<figure class="my-4"><img src="${generatedImageUrl}" alt="${imagePrompt}" class="w-full rounded-lg" /><figcaption class="text-center text-sm text-gray-500 mt-2">${imagePrompt}</figcaption></figure>`;
    
    // Insert at the end of the content (user can move it in editor)
    const updatedContent = rewrittenContent + imageHtml;
    setRewrittenContent(updatedContent);
    setGeneratedImageUrl(null);
    setImagePrompt("");
    toast({
      title: "Image Inserted",
      description: "The image has been added to your content. You can move it to the desired location in the editor.",
    });
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
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={analyzeMutation.isPending || quickFetchMutation.isPending}
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
                <Button
                  type="button"
                  variant="outline"
                  disabled={analyzeMutation.isPending || quickFetchMutation.isPending}
                  onClick={() => {
                    const values = form.getValues();
                    if (values.url && values.targetKeyword) {
                      quickFetchMutation.mutate(values);
                    } else {
                      toast({
                        title: "Missing Fields",
                        description: "Please enter a URL and target keyword.",
                        variant: "destructive",
                      });
                    }
                  }}
                  data-testid="button-quick-fetch"
                >
                  {quickFetchMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Quick Fetch
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Quick Actions - shows after Quick Fetch without requiring full analysis */}
      {quickFetchResult && directPrompts.length > 0 && !analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Apply direct prompts to your content - no analysis required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {directPrompts.map((prompt) => (
                <div 
                  key={prompt.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <p className="font-medium">{prompt.name}</p>
                    {prompt.description && (
                      <p className="text-sm text-muted-foreground">{prompt.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      const content = quickFetchResult.pageContent?.htmlContent || quickFetchResult.pageContent?.content || "";
                      if (!content) {
                        toast({
                          title: "No Content",
                          description: "Page content not available.",
                          variant: "destructive",
                        });
                        return;
                      }
                      directApplyMutation.mutate({
                        content,
                        promptId: String(prompt.id),
                        targetKeyword: form.getValues("targetKeyword"),
                      });
                    }}
                    disabled={directApplyMutation.isPending}
                    data-testid={`button-quick-apply-${prompt.id}`}
                  >
                    {directApplyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Show rewritten content editor */}
            {showRewriteEditor && rewrittenContent && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium mb-2">Rewritten Content</h3>
                <ScrollArea className="h-[400px] border rounded-md p-2">
                  <TiptapEditor 
                    content={rewrittenContent}
                    onChange={(content) => setRewrittenContent(content)}
                  />
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                    <div className="flex items-center gap-2">
                      {analysisPrompts.length > 0 && (
                        <Select
                          value={selectedPromptId || (getSelectedPrompt()?.id?.toString() || "")}
                          onValueChange={setSelectedPromptId}
                        >
                          <SelectTrigger className="w-[180px] h-8" data-testid="select-optimization-prompt">
                            <SelectValue placeholder="Select prompt..." />
                          </SelectTrigger>
                          <SelectContent>
                            {analysisPrompts.map((prompt) => (
                              <SelectItem key={prompt.id} value={prompt.id.toString()}>
                                {prompt.name} {prompt.isDefault && "(default)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        size="sm"
                        onClick={handleImplementRecommendations}
                        disabled={implementMutation.isPending}
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
                            {selectedRecommendations.length > 0 
                              ? `Implement (${selectedRecommendations.length})`
                              : "Implement"
                            }
                          </>
                        )}
                      </Button>
                    </div>
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

            {/* Direct Apply Prompts - Can be applied without full analysis */}
            {directPrompts.length > 0 && analysisResult?.pageContent && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-green-500" />
                    <CardTitle>Quick Actions</CardTitle>
                  </div>
                  <CardDescription>
                    Apply these prompts directly to your content without requiring recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {directPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                        data-testid={`direct-prompt-${prompt.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{prompt.name}</p>
                          {prompt.description && (
                            <p className="text-xs text-muted-foreground truncate">{prompt.description}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDirectApply(prompt.id.toString())}
                          disabled={directApplyMutation.isPending}
                          data-testid={`button-apply-direct-${prompt.id}`}
                        >
                          {directApplyMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* DEBUG PANEL - Remove later */}
            {debugInfo && (
              <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                <CardHeader>
                  <CardTitle className="text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Debug: AI Request Details
                  </CardTitle>
                  <CardDescription className="text-yellow-600 dark:text-yellow-400">
                    Last request at {debugInfo.timestamp}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-yellow-700 dark:text-yellow-300 font-semibold">Selected Prompt:</Label>
                      <p className="text-sm font-mono bg-white dark:bg-black/30 p-2 rounded mt-1">{debugInfo.promptName}</p>
                    </div>
                    <div>
                      <Label className="text-yellow-700 dark:text-yellow-300 font-semibold">Prompt ID (sent to API):</Label>
                      <p className="text-sm font-mono bg-white dark:bg-black/30 p-2 rounded mt-1">{debugInfo.promptId}</p>
                    </div>
                    <div>
                      <Label className="text-yellow-700 dark:text-yellow-300 font-semibold">Dropdown State:</Label>
                      <p className="text-sm font-mono bg-white dark:bg-black/30 p-2 rounded mt-1">{debugInfo.selectedPromptIdState}</p>
                    </div>
                    <div>
                      <Label className="text-yellow-700 dark:text-yellow-300 font-semibold">Available Prompts:</Label>
                      <p className="text-sm font-mono bg-white dark:bg-black/30 p-2 rounded mt-1">{debugInfo.optimizationPromptsCount} prompts loaded</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-yellow-700 dark:text-yellow-300 font-semibold">Target Keyword:</Label>
                    <p className="text-sm font-mono bg-white dark:bg-black/30 p-2 rounded mt-1">{debugInfo.targetKeyword || "(none)"}</p>
                  </div>
                  <div>
                    <Label className="text-yellow-700 dark:text-yellow-300 font-semibold">Content Length:</Label>
                    <p className="text-sm font-mono bg-white dark:bg-black/30 p-2 rounded mt-1">{debugInfo.contentLength.toLocaleString()} characters</p>
                  </div>
                  <div>
                    <Label className="text-yellow-700 dark:text-yellow-300 font-semibold">Recommendations ({debugInfo.recommendationsCount}):</Label>
                    <pre className="text-xs font-mono bg-white dark:bg-black/30 p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">{debugInfo.recommendations}</pre>
                  </div>
                  <div>
                    <Label className="text-yellow-700 dark:text-yellow-300 font-semibold">Raw Template (before placeholder replacement):</Label>
                    <pre className="text-xs font-mono bg-white dark:bg-black/30 p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">{debugInfo.promptText}</pre>
                  </div>
                  {debugInfo.processedPrompt && (
                    <div className="border-t-2 border-green-500 pt-4">
                      <Label className="text-green-700 dark:text-green-300 font-semibold">ACTUAL PROMPT SENT TO AI (after placeholder replacement):</Label>
                      <pre className="text-xs font-mono bg-green-50 dark:bg-green-900/30 p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap max-h-80 overflow-y-auto border border-green-300 dark:border-green-700">{debugInfo.processedPrompt}</pre>
                    </div>
                  )}
                  {!debugInfo.processedPrompt && (
                    <div className="border-t-2 border-gray-300 pt-4">
                      <Label className="text-gray-500 dark:text-gray-400 font-semibold">Processed Prompt:</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">Will appear after AI completes processing...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {showRewriteEditor && rewrittenContent && (
              <>
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
                      variant="outline"
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
                            description: "Rewritten content has been applied to the editor. Use 'Save Draft' to persist changes.",
                          });
                        }
                      }}
                      data-testid="button-apply-rewrite"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Apply to Editor
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (analysisResult?.id && rewrittenContent) {
                          saveContentMutation.mutate(
                            { id: analysisResult.id, htmlContent: rewrittenContent },
                            {
                              onSuccess: () => {
                                setAnalysisResult({
                                  ...analysisResult,
                                  pageContent: {
                                    ...analysisResult.pageContent,
                                    htmlContent: rewrittenContent,
                                  },
                                });
                                setOriginalContent(rewrittenContent);
                                setShowRewriteEditor(false);
                                setRewrittenContent(null);
                                setSelectedRecommendations([]);
                                setHasContentChanges(false);
                              },
                            }
                          );
                        }
                      }}
                      disabled={saveContentMutation.isPending || !analysisResult?.id}
                      data-testid="button-save-rewrite"
                    >
                      {saveContentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Draft
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

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Generate Image
                  </CardTitle>
                  <CardDescription>
                    Generate and insert images into your optimized content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="opt-image-provider">AI Provider</Label>
                      <Select value={imageProvider} onValueChange={(value: "gemini" | "openai") => setImageProvider(value)}>
                        <SelectTrigger id="opt-image-provider" data-testid="select-opt-image-provider">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini">Gemini</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="opt-image-style">Image Style</Label>
                      <Select value={selectedImageStyleId} onValueChange={setSelectedImageStyleId}>
                        <SelectTrigger id="opt-image-style" data-testid="select-opt-image-style">
                          <SelectValue placeholder="Select a style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          {imageStyles.map((style) => (
                            <SelectItem key={style.id} value={style.id}>
                              {style.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="opt-image-aspect-ratio">Aspect Ratio</Label>
                      <Select value={imageAspectRatio} onValueChange={setImageAspectRatio}>
                        <SelectTrigger id="opt-image-aspect-ratio" data-testid="select-opt-image-aspect-ratio">
                          <SelectValue placeholder="Select ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                          <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                          <SelectItem value="3:2">3:2 (Photo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opt-image-prompt">Image Prompt</Label>
                    <Textarea
                      id="opt-image-prompt"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the image you want to generate..."
                      className="min-h-[80px]"
                      data-testid="input-opt-image-prompt"
                    />
                  </div>

                  <Button 
                    className="w-full"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !imagePrompt.trim()}
                    data-testid="button-opt-generate-image"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>

                  {generatedImageUrl && (
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground">Generated Image</Label>
                      <div className="rounded-md overflow-hidden border">
                        <img 
                          src={generatedImageUrl} 
                          alt={imagePrompt} 
                          className="w-full h-auto"
                          data-testid="img-opt-generated"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={handleGenerateImage}
                          disabled={isGeneratingImage}
                          data-testid="button-opt-regenerate-image"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={handleInsertImageIntoContent}
                          data-testid="button-opt-insert-image"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Insert into Content
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              </>
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
