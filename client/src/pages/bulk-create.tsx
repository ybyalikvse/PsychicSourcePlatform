import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Wand2, 
  Plus, 
  Trash2, 
  Play, 
  Check, 
  X, 
  Loader2, 
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
  Pause,
  RotateCcw,
  Save,
  Pencil
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WritingStyle, SeoSettings } from "@shared/schema";

interface ArticleQueueItem {
  id: string;
  targetKeyword: string;
  recommendedKeywords: string;
  status: "pending" | "generating" | "generating-meta" | "saving" | "completed" | "error";
  content?: string;
  metaTitles?: string[];
  metaDescriptions?: string[];
  savedArticleId?: string;
  error?: string;
  progress?: number;
}

interface BulkResult {
  id: string;
  targetKeyword: string;
  content: string;
  metaTitles: string[];
  metaDescriptions: string[];
  selectedTitle: string;
  selectedDescription: string;
  savedArticleId?: string;
}

function parseKeywordsInput(input: string): { keywords: string[]; sections: string[] } {
  const lines = input.split('\n').map(line => line.trim()).filter(Boolean);
  const keywords: string[] = [];
  const sections: string[] = [];
  
  for (const line of lines) {
    if (line.includes('Relevant terms:') || line.match(/^\d+\.\s/) || line.includes('Ask AI')) {
      continue;
    }
    
    if (line.match(/^[A-Z][\w\s]+\s*\([^)]+\)$/) || 
        (line.match(/^[A-Z][\w\s]+$/) && !line.includes(',') && !line.includes('•'))) {
      sections.push(line);
      continue;
    }
    
    if (line.includes('•')) {
      const parts = line.split('•').map(p => p.trim()).filter(Boolean);
      keywords.push(...parts);
    } else if (line.includes(',')) {
      const parts = line.split(',').map(p => p.trim()).filter(Boolean);
      keywords.push(...parts);
    } else if (!line.match(/^\d+$/) && line.length > 2) {
      keywords.push(line);
    }
  }
  
  const uniqueKeywords = Array.from(new Set(keywords.filter(k => k.length > 2 && !k.match(/^\d+$/))));
  const uniqueSections = Array.from(new Set(sections));
  
  return { keywords: uniqueKeywords, sections: uniqueSections };
}

export default function BulkCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [selectedStyleId, setSelectedStyleId] = useState<string>("default");
  const [wordCount, setWordCount] = useState("1500");
  const [contentProvider, setContentProvider] = useState<"anthropic" | "openai">("anthropic");
  
  const [articleQueue, setArticleQueue] = useState<ArticleQueueItem[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newRecommendedKeywords, setNewRecommendedKeywords] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  
  const [results, setResults] = useState<BulkResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const shouldStopRef = useRef(false);

  const { data: writingStyles = [] } = useQuery<WritingStyle[]>({
    queryKey: ["/api/writing-styles"],
  });

  const { data: seoSettings } = useQuery<SeoSettings>({
    queryKey: ["/api/seo-settings"],
  });

  const addToQueue = useCallback(() => {
    if (!newKeyword.trim()) {
      toast({ title: "Please enter a target keyword", variant: "destructive" });
      return;
    }
    
    const newItem: ArticleQueueItem = {
      id: crypto.randomUUID(),
      targetKeyword: newKeyword.trim(),
      recommendedKeywords: newRecommendedKeywords.trim(),
      status: "pending",
    };
    
    setArticleQueue(prev => [...prev, newItem]);
    setNewKeyword("");
    setNewRecommendedKeywords("");
    
    toast({ title: "Article added to queue" });
  }, [newKeyword, newRecommendedKeywords, toast]);

  const removeFromQueue = useCallback((id: string) => {
    setArticleQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    if (isProcessing) {
      toast({ title: "Cannot clear while processing", variant: "destructive" });
      return;
    }
    setArticleQueue([]);
    setResults([]);
    setShowResults(false);
  }, [isProcessing, toast]);

  const processQueue = useCallback(async () => {
    if (articleQueue.length === 0) {
      toast({ title: "No articles in queue", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setShowResults(false);
    setResults([]);
    shouldStopRef.current = false;
    abortControllerRef.current = new AbortController();

    const itemsToProcess = articleQueue
      .filter(item => item.status === "pending" || item.status === "error")
      .map(item => ({ ...item }));
    
    const totalItems = itemsToProcess.length;
    const generatedResults: BulkResult[] = [];
    let completedCount = 0;

    for (let i = 0; i < itemsToProcess.length; i++) {
      if (shouldStopRef.current) {
        toast({ title: "Processing stopped" });
        break;
      }

      const item = itemsToProcess[i];
      const itemId = item.id;
      const itemKeyword = item.targetKeyword;
      const itemRecommendedKeywords = item.recommendedKeywords;
      
      setCurrentIndex(i);
      setOverallProgress((i / totalItems) * 100);

      setArticleQueue(prev => prev.map(a => 
        a.id === itemId ? { ...a, status: "generating", progress: 0 } : a
      ));

      try {
        const parsed = parseKeywordsInput(itemRecommendedKeywords);
        
        const response = await fetch("/api/content/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetKeyword: itemKeyword,
            wordCount: parseInt(wordCount) || 1500,
            recommendedKeywords: parsed.keywords,
            suggestedSections: parsed.sections,
            styleId: selectedStyleId !== "default" ? selectedStyleId : undefined,
            provider: contentProvider,
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to generate content");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  const wordsSoFar = fullContent.split(/\s+/).filter(Boolean).length;
                  const targetWords = parseInt(wordCount) || 1500;
                  const progress = Math.min(90, (wordsSoFar / targetWords) * 100);
                  
                  setArticleQueue(prev => prev.map(a => 
                    a.id === itemId ? { ...a, progress } : a
                  ));
                }
                if (data.done) {
                  fullContent = data.fullContent || fullContent;
                }
              } catch {}
            }
          }
        }
        
        setArticleQueue(prev => prev.map(a => 
          a.id === itemId ? { ...a, status: "generating-meta", content: fullContent, progress: 95 } : a
        ));

        const titleMatch = fullContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : itemKeyword;
        
        const metaResponse = await fetch("/api/content/meta-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content: fullContent, targetKeyword: itemKeyword }),
          signal: abortControllerRef.current?.signal,
        });

        if (!metaResponse.ok) {
          throw new Error("Failed to generate meta suggestions");
        }

        const metaData = await metaResponse.json();
        const metaTitles = (metaData.titles || []).slice(0, 3);
        const metaDescriptions = (metaData.descriptions || []).slice(0, 3);

        setArticleQueue(prev => prev.map(a => 
          a.id === itemId ? { 
            ...a, 
            status: "saving", 
            content: fullContent,
            metaTitles,
            metaDescriptions,
            progress: 98 
          } : a
        ));

        // Auto-save article as draft
        const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const wordCountNum = fullContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length;
        
        const saveResponse = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content: fullContent,
            targetKeyword: itemKeyword,
            metaTitle: metaTitles[0] || "",
            metaDescription: metaDescriptions[0] || "",
            slug,
            status: "draft",
            wordCount: wordCountNum,
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!saveResponse.ok) {
          throw new Error("Failed to save article");
        }

        const savedArticle = await saveResponse.json();

        setArticleQueue(prev => prev.map(a => 
          a.id === itemId ? { 
            ...a, 
            status: "completed", 
            content: fullContent,
            metaTitles,
            metaDescriptions,
            savedArticleId: savedArticle.id,
            progress: 100 
          } : a
        ));

        const newResult: BulkResult = {
          id: itemId,
          targetKeyword: itemKeyword,
          content: fullContent,
          metaTitles,
          metaDescriptions,
          selectedTitle: metaTitles[0] || "",
          selectedDescription: metaDescriptions[0] || "",
          savedArticleId: savedArticle.id,
        };
        
        generatedResults.push(newResult);
        completedCount++;
        
        setResults([...generatedResults]);

      } catch (error: any) {
        if (error.name === "AbortError") {
          setArticleQueue(prev => prev.map(a => 
            a.id === itemId ? { ...a, status: "pending", progress: 0 } : a
          ));
        } else {
          setArticleQueue(prev => prev.map(a => 
            a.id === itemId ? { ...a, status: "error", error: error.message } : a
          ));
        }
      }
    }

    setOverallProgress(100);
    setIsProcessing(false);
    setShowResults(true);
    
    // Invalidate articles query so they appear in content list
    queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    
    toast({ 
      title: "Bulk generation complete", 
      description: `Generated and saved ${completedCount} article${completedCount !== 1 ? 's' : ''} as drafts` 
    });
  }, [articleQueue, wordCount, selectedStyleId, contentProvider, toast]);

  const stopProcessing = useCallback(() => {
    shouldStopRef.current = true;
    abortControllerRef.current?.abort();
    setIsProcessing(false);
    toast({ title: "Stopping after current article..." });
  }, [toast]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  }, [toast]);

  const handleUpdateMeta = async (result: BulkResult) => {
    if (!result.savedArticleId) return;
    
    setIsSaving(true);
    
    try {
      await apiRequest("PATCH", `/api/articles/${result.savedArticleId}`, {
        metaTitle: result.selectedTitle,
        metaDescription: result.selectedDescription,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles", result.savedArticleId] });
      
      toast({ title: "Meta data updated" });
    } catch (error) {
      toast({ title: "Failed to update meta data", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const updateResultMeta = (id: string, field: "selectedTitle" | "selectedDescription", value: string) => {
    setResults(prev => prev.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const completedCount = articleQueue.filter(a => a.status === "completed").length;
  const errorCount = articleQueue.filter(a => a.status === "error").length;
  const pendingCount = articleQueue.filter(a => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Bulk Content Creation</h1>
          <p className="text-muted-foreground">Generate multiple articles with AI and auto-generate meta tags</p>
        </div>
        
        {articleQueue.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" data-testid="badge-pending-count">
              {pendingCount} Pending
            </Badge>
            <Badge variant="default" className="bg-green-600" data-testid="badge-completed-count">
              {completedCount} Completed
            </Badge>
            {errorCount > 0 && (
              <Badge variant="destructive" data-testid="badge-error-count">
                {errorCount} Errors
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Generation Settings
              </CardTitle>
              <CardDescription>Configure settings for all articles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="writing-style">Writing Style</Label>
                <Select value={selectedStyleId} onValueChange={setSelectedStyleId}>
                  <SelectTrigger id="writing-style" data-testid="select-writing-style">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Style</SelectItem>
                    {writingStyles.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="word-count">Word Count</Label>
                <Input
                  id="word-count"
                  type="number"
                  value={wordCount}
                  onChange={(e) => setWordCount(e.target.value)}
                  placeholder="1500"
                  data-testid="input-word-count"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-provider">AI Provider</Label>
                <Select value={contentProvider} onValueChange={(v: "anthropic" | "openai") => setContentProvider(v)}>
                  <SelectTrigger id="content-provider" data-testid="select-content-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Claude (Anthropic)</SelectItem>
                    <SelectItem value="openai">GPT-4o (OpenAI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Article
              </CardTitle>
              <CardDescription>Add articles to the generation queue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-keyword">Target Keyword *</Label>
                <Input
                  id="target-keyword"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g., 747 angel number meaning"
                  data-testid="input-target-keyword"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      addToQueue();
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommended-keywords">Related Keywords (optional)</Label>
                <Textarea
                  id="recommended-keywords"
                  value={newRecommendedKeywords}
                  onChange={(e) => setNewRecommendedKeywords(e.target.value)}
                  placeholder="Paste keywords, bullet lists, or structured content..."
                  className="min-h-[100px]"
                  data-testid="input-recommended-keywords"
                />
              </div>

              <Button 
                onClick={addToQueue} 
                className="w-full"
                disabled={!newKeyword.trim()}
                data-testid="button-add-to-queue"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Queue
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Article Queue ({articleQueue.length})
                  </CardTitle>
                  <CardDescription>Articles waiting to be generated</CardDescription>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {!isProcessing ? (
                    <>
                      <Button
                        onClick={processQueue}
                        disabled={articleQueue.length === 0 || pendingCount === 0}
                        data-testid="button-start-generation"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Generate All
                      </Button>
                      <Button
                        variant="outline"
                        onClick={clearQueue}
                        disabled={articleQueue.length === 0}
                        data-testid="button-clear-queue"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={stopProcessing}
                      data-testid="button-stop-generation"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isProcessing && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
              )}

              {articleQueue.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No articles in queue</p>
                  <p className="text-sm">Add articles using the form on the left</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {articleQueue.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                        data-testid={`queue-item-${index}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{item.targetKeyword}</span>
                            {item.status === "pending" && (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                            {item.status === "generating" && (
                              <Badge variant="default" className="bg-blue-600">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Generating...
                              </Badge>
                            )}
                            {item.status === "generating-meta" && (
                              <Badge variant="default" className="bg-purple-600">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Meta Tags...
                              </Badge>
                            )}
                            {item.status === "saving" && (
                              <Badge variant="default" className="bg-amber-600">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Saving...
                              </Badge>
                            )}
                            {item.status === "completed" && (
                              <Badge variant="default" className="bg-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                Complete
                              </Badge>
                            )}
                            {item.status === "error" && (
                              <Badge variant="destructive">
                                <X className="h-3 w-3 mr-1" />
                                Error
                              </Badge>
                            )}
                          </div>
                          
                          {item.recommendedKeywords && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              Keywords: {item.recommendedKeywords.substring(0, 50)}...
                            </p>
                          )}
                          
                          {item.progress !== undefined && item.progress > 0 && item.progress < 100 && (
                            <Progress value={item.progress} className="h-1 mt-2" />
                          )}
                          
                          {item.error && (
                            <p className="text-sm text-destructive mt-1">{item.error}</p>
                          )}
                        </div>
                        
                        {item.status === "pending" && !isProcessing && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeFromQueue(item.id)}
                            data-testid={`button-remove-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {showResults && results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Generated Results ({results.length})
                </CardTitle>
                <CardDescription>Review and save your generated articles</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-3">
                  {results.map((result, index) => (
                    <AccordionItem 
                      key={result.id} 
                      value={result.id}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline" data-testid={`result-toggle-${index}`}>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium text-left">{result.targetKeyword}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Meta Title Options</Label>
                            <div className="mt-2 space-y-2">
                              {result.metaTitles.map((title, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                                    result.selectedTitle === title 
                                      ? "border-primary bg-primary/5" 
                                      : "hover-elevate"
                                  }`}
                                  onClick={() => updateResultMeta(result.id, "selectedTitle", title)}
                                  data-testid={`meta-title-option-${index}-${i}`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    result.selectedTitle === title ? "border-primary" : "border-muted-foreground"
                                  }`}>
                                    {result.selectedTitle === title && (
                                      <div className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                  </div>
                                  <span className="flex-1 text-sm">{title}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(title);
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Meta Description Options</Label>
                            <div className="mt-2 space-y-2">
                              {result.metaDescriptions.map((desc, i) => (
                                <div
                                  key={i}
                                  className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                                    result.selectedDescription === desc 
                                      ? "border-primary bg-primary/5" 
                                      : "hover-elevate"
                                  }`}
                                  onClick={() => updateResultMeta(result.id, "selectedDescription", desc)}
                                  data-testid={`meta-desc-option-${index}-${i}`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                    result.selectedDescription === desc ? "border-primary" : "border-muted-foreground"
                                  }`}>
                                    {result.selectedDescription === desc && (
                                      <div className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                  </div>
                                  <span className="flex-1 text-sm">{desc}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(desc);
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <Label className="text-sm font-medium">Article Content</Label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(result.content)}
                              data-testid={`button-copy-content-inline-${index}`}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                            <div 
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: result.content }}
                              data-testid={`content-preview-${index}`}
                            />
                          </ScrollArea>
                        </div>

                        <Separator />

                        <div className="flex items-center gap-2 flex-wrap">
                          {result.savedArticleId && (
                            <>
                              <Button
                                onClick={() => setLocation(`/edit/${result.savedArticleId}`)}
                                data-testid={`button-edit-article-${index}`}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Article
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => handleUpdateMeta(result)}
                                disabled={isSaving}
                                data-testid={`button-update-meta-${index}`}
                              >
                                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                <Save className="h-4 w-4 mr-2" />
                                Update Meta
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => copyToClipboard(result.content)}
                            data-testid={`button-copy-content-${index}`}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Content
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
