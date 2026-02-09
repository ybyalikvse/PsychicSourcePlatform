import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Pause,
  Save,
  Pencil,
  Eye,
  Settings2,
  ChevronUp,
  ChevronDown
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

function StatusBadge({ status, error }: { status: ArticleQueueItem["status"]; error?: string }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "generating":
      return (
        <Badge variant="default" className="bg-blue-600">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Generating
        </Badge>
      );
    case "generating-meta":
      return (
        <Badge variant="default" className="bg-purple-600">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Meta Tags
        </Badge>
      );
    case "saving":
      return (
        <Badge variant="default" className="bg-amber-600">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Saving
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="default" className="bg-green-600">
          <Check className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" title={error}>
          <X className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    default:
      return null;
  }
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
  const [showSettings, setShowSettings] = useState(false);
  const [previewResult, setPreviewResult] = useState<BulkResult | null>(null);
  
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

  const moveItem = useCallback((id: string, direction: "up" | "down") => {
    setArticleQueue(prev => {
      const idx = prev.findIndex(item => item.id === id);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

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

  const selectedStyle = writingStyles.find(s => s.id === selectedStyleId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Bulk Content Creation</h1>
          <p className="text-muted-foreground">Generate multiple articles with AI and auto-generate meta tags</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            data-testid="button-toggle-settings"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Settings
            {selectedStyle && <Badge variant="secondary" className="ml-2">{selectedStyle.name}</Badge>}
          </Button>
          
          {articleQueue.length > 0 && (
            <>
              <Badge variant="secondary" data-testid="badge-pending-count">
                {pendingCount} Pending
              </Badge>
              <Badge variant="default" className="bg-green-600" data-testid="badge-completed-count">
                {completedCount} Done
              </Badge>
              {errorCount > 0 && (
                <Badge variant="destructive" data-testid="badge-error-count">
                  {errorCount} Errors
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

      {showSettings && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
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
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Article Queue ({articleQueue.length})
            </CardTitle>
            
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

          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-3 w-10">#</th>
                    <th className="text-left font-medium p-3">Target Keyword</th>
                    <th className="text-left font-medium p-3 hidden md:table-cell">Related Keywords</th>
                    <th className="text-left font-medium p-3 w-28">Status</th>
                    <th className="text-left font-medium p-3 w-24 hidden sm:table-cell">Progress</th>
                    <th className="text-right font-medium p-3 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articleQueue.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0"
                      data-testid={`queue-item-${index}`}
                    >
                      <td className="p-3 text-muted-foreground">{index + 1}</td>
                      <td className="p-3">
                        <div className="font-medium">{item.targetKeyword}</div>
                        {item.error && (
                          <p className="text-xs text-destructive mt-1">{item.error}</p>
                        )}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-muted-foreground text-xs truncate block max-w-[200px]">
                          {item.recommendedKeywords 
                            ? item.recommendedKeywords.substring(0, 60) + (item.recommendedKeywords.length > 60 ? "..." : "")
                            : "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={item.status} error={item.error} />
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        {item.progress !== undefined && item.progress > 0 && item.progress < 100 ? (
                          <div className="flex items-center gap-2">
                            <Progress value={item.progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-8">{Math.round(item.progress)}%</span>
                          </div>
                        ) : item.status === "completed" ? (
                          <span className="text-xs text-muted-foreground">100%</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === "pending" && !isProcessing && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => moveItem(item.id, "up")}
                                disabled={index === 0}
                                data-testid={`button-move-up-${index}`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => moveItem(item.id, "down")}
                                disabled={index === articleQueue.length - 1}
                                data-testid={`button-move-down-${index}`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeFromQueue(item.id)}
                                data-testid={`button-remove-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {item.status === "completed" && item.savedArticleId && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setLocation(`/edit/${item.savedArticleId}`)}
                              data-testid={`button-edit-${index}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30">
                    <td className="p-3 text-muted-foreground">
                      <Plus className="h-4 w-4" />
                    </td>
                    <td className="p-3">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="Enter target keyword..."
                        className="h-8"
                        data-testid="input-target-keyword"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            addToQueue();
                          }
                        }}
                      />
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <Input
                        value={newRecommendedKeywords}
                        onChange={(e) => setNewRecommendedKeywords(e.target.value)}
                        placeholder="Related keywords (optional)..."
                        className="h-8"
                        data-testid="input-recommended-keywords"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            addToQueue();
                          }
                        }}
                      />
                    </td>
                    <td className="p-3" colSpan={2}>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        onClick={addToQueue}
                        disabled={!newKeyword.trim()}
                        data-testid="button-add-to-queue"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {articleQueue.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Type a keyword in the row above and press Enter or click Add</p>
            </div>
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
            <CardDescription>Review meta tags and edit your generated articles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium p-3 w-10">#</th>
                      <th className="text-left font-medium p-3">Keyword</th>
                      <th className="text-left font-medium p-3">Meta Title</th>
                      <th className="text-left font-medium p-3 hidden lg:table-cell">Meta Description</th>
                      <th className="text-right font-medium p-3 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr
                        key={result.id}
                        className="border-b last:border-b-0"
                        data-testid={`result-row-${index}`}
                      >
                        <td className="p-3 text-muted-foreground">{index + 1}</td>
                        <td className="p-3">
                          <span className="font-medium">{result.targetKeyword}</span>
                        </td>
                        <td className="p-3">
                          <Select
                            value={result.selectedTitle}
                            onValueChange={(v) => updateResultMeta(result.id, "selectedTitle", v)}
                          >
                            <SelectTrigger className="h-8 text-xs" data-testid={`select-meta-title-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {result.metaTitles.map((title, i) => (
                                <SelectItem key={i} value={title}>
                                  {title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          <Select
                            value={result.selectedDescription}
                            onValueChange={(v) => updateResultMeta(result.id, "selectedDescription", v)}
                          >
                            <SelectTrigger className="h-8 text-xs" data-testid={`select-meta-desc-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {result.metaDescriptions.map((desc, i) => (
                                <SelectItem key={i} value={desc}>
                                  {desc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setPreviewResult(result)}
                              data-testid={`button-preview-${index}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyToClipboard(result.content)}
                              data-testid={`button-copy-content-${index}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {result.savedArticleId && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setLocation(`/edit/${result.savedArticleId}`)}
                                  data-testid={`button-edit-article-${index}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleUpdateMeta(result)}
                                  disabled={isSaving}
                                  data-testid={`button-update-meta-${index}`}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!previewResult} onOpenChange={() => setPreviewResult(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewResult?.targetKeyword}</DialogTitle>
          </DialogHeader>
          {previewResult && (
            <ScrollArea className="h-[60vh]">
              <div 
                className="prose prose-sm dark:prose-invert max-w-none pr-4"
                dangerouslySetInnerHTML={{ __html: previewResult.content }}
              />
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
