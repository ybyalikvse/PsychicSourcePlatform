import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Image,
  Save,
  Eye,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { SeoScoreRing } from "./seo-score-ring";
import { SuggestionCard } from "./suggestion-card";
import type { Article, ContentSuggestion, ContentOptimizationResult } from "@shared/schema";

interface ContentEditorProps {
  article?: Article;
  suggestions?: ContentSuggestion[];
  optimization?: ContentOptimizationResult;
  onSave?: (article: Partial<Article>) => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  isSaving?: boolean;
}

export function ContentEditor({
  article,
  suggestions = [],
  optimization,
  onSave,
  onAnalyze,
  isAnalyzing,
  isSaving,
}: ContentEditorProps) {
  const [title, setTitle] = useState(article?.title || "");
  const [content, setContent] = useState(article?.content || "");
  const [targetKeyword, setTargetKeyword] = useState(article?.targetKeyword || "");
  const [metaTitle, setMetaTitle] = useState(article?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription || "");

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
      setTargetKeyword(article.targetKeyword || "");
      setMetaTitle(article.metaTitle || "");
      setMetaDescription(article.metaDescription || "");
    }
  }, [article]);

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  const handleSave = useCallback(() => {
    onSave?.({
      title,
      content,
      targetKeyword,
      metaTitle,
      metaDescription,
      wordCount,
    });
  }, [title, content, targetKeyword, metaTitle, metaDescription, wordCount, onSave]);

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = document.querySelector('textarea[data-testid="input-content"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newContent);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full" data-testid="content-editor">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">Content Editor</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAnalyze}
                  disabled={isAnalyzing || !content}
                  data-testid="button-analyze"
                >
                  <Sparkles className={`h-4 w-4 mr-2 ${isAnalyzing ? "animate-pulse" : ""}`} />
                  Analyze
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !title}
                  data-testid="button-save"
                >
                  <Save className={`h-4 w-4 mr-2 ${isSaving ? "animate-spin" : ""}`} />
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title..."
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-keyword">Target Keyword</Label>
              <Input
                id="target-keyword"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="e.g., psychic reading, tarot cards..."
                data-testid="input-target-keyword"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
              <Button variant="ghost" size="icon" onClick={() => insertFormatting("**")} data-testid="button-bold">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => insertFormatting("*")} data-testid="button-italic">
                <Italic className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="icon" onClick={() => insertFormatting("# ", "")} data-testid="button-h1">
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => insertFormatting("## ", "")} data-testid="button-h2">
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => insertFormatting("### ", "")} data-testid="button-h3">
                <Heading3 className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="icon" onClick={() => insertFormatting("- ", "")} data-testid="button-list">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => insertFormatting("1. ", "")} data-testid="button-ordered-list">
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="icon" onClick={() => insertFormatting("[", "](url)")} data-testid="button-link">
                <Link className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => insertFormatting("![alt](", ")")} data-testid="button-image">
                <Image className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Content</Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {wordCount.toLocaleString()} words
                </span>
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your content..."
                className="min-h-[400px] font-mono text-sm"
                data-testid="input-content"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="meta-title">Meta Title</Label>
                <span className="text-xs text-muted-foreground">
                  {metaTitle.length}/60
                </span>
              </div>
              <Input
                id="meta-title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="SEO title for search engines..."
                maxLength={60}
                data-testid="input-meta-title"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="meta-description">Meta Description</Label>
                <span className="text-xs text-muted-foreground">
                  {metaDescription.length}/160
                </span>
              </div>
              <Textarea
                id="meta-description"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Brief description for search results..."
                maxLength={160}
                className="min-h-[80px]"
                data-testid="input-meta-description"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Content Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <SeoScoreRing score={optimization?.seoScore ?? 0} size="lg" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold font-mono">
                  {optimization?.readabilityScore ?? "--"}
                </div>
                <div className="text-xs text-muted-foreground">Readability</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">
                  {optimization?.keywordDensity?.toFixed(1) ?? "--"}%
                </div>
                <div className="text-xs text-muted-foreground">Keyword Density</div>
              </div>
            </div>

            {optimization?.headingStructure && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-2">Heading Structure</div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">H1: {optimization.headingStructure.h1}</Badge>
                  <Badge variant="outline">H2: {optimization.headingStructure.h2}</Badge>
                  <Badge variant="outline">H3: {optimization.headingStructure.h3}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">AI Suggestions</CardTitle>
              {suggestions.length > 0 && (
                <Badge variant="secondary">{suggestions.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 p-4">
                {suggestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Click "Analyze" to get AI-powered suggestions
                    </p>
                  </div>
                ) : (
                  suggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
