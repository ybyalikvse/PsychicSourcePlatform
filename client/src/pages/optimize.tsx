import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

const optimizeFormSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  targetKeyword: z.string().min(1, "Target keyword is required"),
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
  contentSnippet: string;
}

interface Recommendation {
  type: "title" | "meta" | "content" | "headings" | "keywords";
  priority: "high" | "medium" | "low";
  current: string;
  suggested: string;
  reason: string;
}

interface AnalysisResult {
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
  };
  competitors: CompetitorData[];
  recommendations: Recommendation[];
}

export default function Optimize() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>("");

  const form = useForm<OptimizeFormData>({
    resolver: zodResolver(optimizeFormSchema),
    defaultValues: {
      url: "",
      targetKeyword: "",
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: OptimizeFormData) => {
      const response = await apiRequest("POST", "/api/optimize/analyze", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setAnalysisStep("");
      toast({
        title: "Analysis Complete",
        description: "Your article has been analyzed with competitor insights.",
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
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Article Optimizer
        </h1>
        <p className="text-muted-foreground mt-1">
          Analyze your content against top-ranking competitors and get AI-powered recommendations
        </p>
      </div>

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
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
                <CardDescription>
                  AI-powered suggestions to improve your ranking for "{form.getValues("targetKeyword")}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.recommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>Your content is well-optimized! No major improvements needed.</p>
                    </div>
                  ) : (
                    analysisResult.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`recommendation-${index}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(rec.type)}
                            <span className="font-medium capitalize">{rec.type}</span>
                          </div>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.reason}</p>
                        {rec.current && (
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-3">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                              Current:
                            </p>
                            <p className="text-sm">{rec.current}</p>
                          </div>
                        )}
                        {rec.suggested && (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3">
                            <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                              Suggested:
                            </p>
                            <p className="text-sm">{rec.suggested}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Content Analysis</CardTitle>
                <CardDescription>Current state of your article</CardDescription>
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

                {analysisResult.pageContent.headings.h1.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">H1 Headings</h4>
                    <ul className="space-y-1">
                      {analysisResult.pageContent.headings.h1.map((h, i) => (
                        <li key={i} className="text-sm bg-muted/50 rounded-md p-2">
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.pageContent.headings.h2.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">H2 Headings</h4>
                    <ul className="space-y-1">
                      {analysisResult.pageContent.headings.h2.map((h, i) => (
                        <li key={i} className="text-sm bg-muted/50 rounded-md p-2">
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.pageContent.content && (
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
