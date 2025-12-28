import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { ContentEditor } from "@/components/content-editor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Article, ContentSuggestion, ContentOptimizationResult } from "@shared/schema";

export default function Editor() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const params = new URLSearchParams(search);
  const articleId = params.get("id");

  const [optimization, setOptimization] = useState<ContentOptimizationResult | undefined>();
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: ["/api/articles", articleId],
    enabled: !!articleId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Article>) => {
      if (articleId) {
        const response = await apiRequest("PATCH", `/api/articles/${articleId}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/articles", {
          ...data,
          slug: data.title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "untitled",
          status: "draft",
        });
        return response.json();
      }
    },
    onSuccess: (data: Article) => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: articleId ? "Article updated" : "Article created",
        description: "Your changes have been saved.",
      });
      if (!articleId && data?.id) {
        setLocation(`/editor?id=${data.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save article. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: { content: string; targetKeyword?: string }) => {
      const response = await apiRequest("POST", "/api/content/analyze", data);
      return response.json() as Promise<{ optimization: ContentOptimizationResult; suggestions: ContentSuggestion[] }>;
    },
    onSuccess: (data) => {
      if (data) {
        setOptimization(data.optimization);
        setSuggestions(data.suggestions || []);
        toast({
          title: "Analysis complete",
          description: `SEO Score: ${data.optimization?.seoScore || 0}`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Could not analyze content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    const contentArea = document.querySelector('textarea[data-testid="input-content"]') as HTMLTextAreaElement;
    const keywordInput = document.querySelector('input[data-testid="input-target-keyword"]') as HTMLInputElement;
    
    if (contentArea?.value) {
      analyzeMutation.mutate({
        content: contentArea.value,
        targetKeyword: keywordInput?.value,
      });
    }
  };

  if (articleId && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="page-editor">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/content")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {articleId ? "Edit Article" : "New Article"}
          </h1>
          <p className="text-muted-foreground">
            Create and optimize content with AI assistance
          </p>
        </div>
      </div>

      <ContentEditor
        article={article}
        suggestions={suggestions}
        optimization={optimization}
        onSave={(data) => saveMutation.mutate(data)}
        onAnalyze={handleAnalyze}
        isAnalyzing={analyzeMutation.isPending}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}
