import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Wand2, 
  Save, 
  Copy, 
  RefreshCw, 
  ArrowRight, 
  Sparkles,
  Check,
  X,
  FileText,
  Tags,
  ImageIcon,
  Loader2,
  Pencil,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TiptapEditor } from "@/components/tiptap-editor";
import type { WritingStyle, SeoSettings, ImageStyle, Article } from "@shared/schema";

interface MetaSuggestions {
  titles: string[];
  descriptions: string[];
}

export default function CreateWithAI() {
  const [, setLocation] = useLocation();
  const [, editParams] = useRoute("/edit/:id");
  const { toast } = useToast();
  
  const articleId = editParams?.id;
  const isEditMode = !!articleId;
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [targetKeyword, setTargetKeyword] = useState("");
  const [recommendedKeywords, setRecommendedKeywords] = useState("");
  const [selectedStyleId, setSelectedStyleId] = useState<string>("default");
  const [wordCount, setWordCount] = useState("1500");
  const [contentProvider, setContentProvider] = useState<"anthropic" | "openai">("anthropic");
  
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const [metaSuggestions, setMetaSuggestions] = useState<MetaSuggestions | null>(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedDescription, setSelectedDescription] = useState("");
  const [articleStatus, setArticleStatus] = useState<string>("draft");

  const abortControllerRef = useRef<AbortController | null>(null);

  const { data: existingArticle, isLoading: isLoadingArticle } = useQuery<Article>({
    queryKey: ["/api/articles", articleId],
    enabled: isEditMode,
  });

  useEffect(() => {
    if (isEditMode && existingArticle && !isInitialized) {
      setTargetKeyword(existingArticle.targetKeyword || "");
      setGeneratedContent(existingArticle.content || "");
      setSelectedTitle(existingArticle.metaTitle || "");
      setSelectedDescription(existingArticle.metaDescription || "");
      setArticleStatus(existingArticle.status || "draft");
      setIsInitialized(true);
    }
  }, [isEditMode, existingArticle, isInitialized]);

  const { data: writingStyles = [] } = useQuery<WritingStyle[]>({
    queryKey: ["/api/writing-styles"],
  });

  const { data: imageStyles = [] } = useQuery<ImageStyle[]>({
    queryKey: ["/api/image-styles"],
  });

  const { data: seoSettings } = useQuery<SeoSettings>({
    queryKey: ["/api/seo-settings"],
  });

  const [selectedImageStyleId, setSelectedImageStyleId] = useState<string>("default");
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageProvider, setImageProvider] = useState<"gemini" | "openai">("gemini");
  const [imageAspectRatio, setImageAspectRatio] = useState<string>("16:9");
  
  const [blogImageCount, setBlogImageCount] = useState(3);
  const [blogImages, setBlogImages] = useState<Array<{ image: string; prompt: string; styleId: string; isGenerating: boolean }>>(
    Array(3).fill(null).map(() => ({ image: "", prompt: "", styleId: "default", isGenerating: false }))
  );
  const [imageSuggestions, setImageSuggestions] = useState<Array<{ title: string; prompt: string; placement: string }>>([]);
  const [isLoadingImageSuggestions, setIsLoadingImageSuggestions] = useState(false);
  const [imageSuggestionsDialogOpen, setImageSuggestionsDialogOpen] = useState(false);
  const [suggestionTarget, setSuggestionTarget] = useState<"featured" | number>("featured");
  const [isInsertingImage, setIsInsertingImage] = useState(false);

  const saveArticleMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      targetKeyword: string;
      metaTitle: string;
      metaDescription: string;
    }) => {
      const slug = data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const wordCountNum = data.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length;
      
      if (isEditMode && articleId) {
        return await apiRequest("PATCH", `/api/articles/${articleId}`, {
          ...data,
          slug,
          status: articleStatus,
          wordCount: wordCountNum,
        });
      } else {
        return await apiRequest("POST", "/api/articles", {
          ...data,
          slug,
          status: "draft",
          wordCount: wordCountNum,
        });
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      if (isEditMode && articleId) {
        queryClient.invalidateQueries({ queryKey: ["/api/articles", articleId] });
      }
      toast({ title: isEditMode ? "Article updated" : "Article saved as draft" });
      setLocation("/content");
    },
    onError: () => {
      toast({ title: isEditMode ? "Failed to update article" : "Failed to save article", variant: "destructive" });
    },
  });

  const handleGenerate = useCallback(async () => {
    if (!targetKeyword.trim()) {
      toast({ title: "Please enter a target keyword", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");
    setGenerationProgress(0);

    abortControllerRef.current = new AbortController();

    try {
      const keywordsArray = recommendedKeywords
        .split(",")
        .map(k => k.trim())
        .filter(Boolean);

      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: targetKeyword.trim(),
          wordCount: parseInt(wordCount) || 1500,
          recommendedKeywords: keywordsArray,
          styleId: selectedStyleId !== "default" ? selectedStyleId : undefined,
          provider: contentProvider,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      const targetWords = parseInt(wordCount) || 1500;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setGeneratedContent(fullContent);
                  const currentWords = fullContent.split(/\s+/).filter(Boolean).length;
                  setGenerationProgress(Math.min((currentWords / targetWords) * 100, 100));
                }
                if (data.done) {
                  setGenerationProgress(100);
                }
              } catch (e) {
                // Ignore parse errors from SSE
              }
            }
          }
        }
      }

      const cleanedContent = cleanGeneratedContent(fullContent);
      setGeneratedContent(cleanedContent);
      
      toast({ title: "Content generated successfully" });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Generation error:", error);
        toast({ title: "Failed to generate content", variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [targetKeyword, recommendedKeywords, selectedStyleId, wordCount, toast]);

  const cleanGeneratedContent = (content: string): string => {
    let cleaned = content;
    
    // Remove code block wrappers (```html ... ``` or ``` ... ```)
    cleaned = cleaned.replace(/^```(?:html)?\s*\n?/i, "");
    cleaned = cleaned.replace(/\n?```\s*$/i, "");
    
    // Convert markdown headers to HTML if they slipped through
    cleaned = cleaned.replace(/^######\s+(.*)$/gm, "<h6>$1</h6>");
    cleaned = cleaned.replace(/^#####\s+(.*)$/gm, "<h5>$1</h5>");
    cleaned = cleaned.replace(/^####\s+(.*)$/gm, "<h4>$1</h4>");
    cleaned = cleaned.replace(/^###\s+(.*)$/gm, "<h3>$1</h3>");
    cleaned = cleaned.replace(/^##\s+(.*)$/gm, "<h2>$1</h2>");
    cleaned = cleaned.replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");
    
    // Clean up any standalone ### that might remain
    cleaned = cleaned.replace(/#{2,6}\s*/g, "");
    
    return cleaned.trim();
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      toast({ title: "Generation stopped" });
    }
  };

  const handleGenerateMetaSuggestions = async () => {
    if (!targetKeyword.trim()) {
      toast({ title: "Please enter a target keyword first", variant: "destructive" });
      return;
    }

    setIsLoadingMeta(true);
    setMetaDialogOpen(true);

    try {
      const response = await apiRequest("POST", "/api/content/meta-suggestions", {
        targetKeyword: targetKeyword.trim(),
        content: generatedContent,
        title: extractTitle(generatedContent),
      });

      const data = await response.json();
      setMetaSuggestions(data);
    } catch (error) {
      console.error("Meta suggestions error:", error);
      toast({ title: "Failed to generate meta suggestions", variant: "destructive" });
    } finally {
      setIsLoadingMeta(false);
    }
  };

  const extractTitle = (content: string): string => {
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || content.match(/^#\s+(.*)$/m);
    return h1Match ? h1Match[1].replace(/<[^>]*>/g, "") : "";
  };

  const stripHtmlTags = (html: string): string => {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({ title: "Content copied to clipboard" });
  };

  const handleSaveAsDraft = () => {
    const title = extractTitle(generatedContent) || `Article about ${targetKeyword}`;
    
    saveArticleMutation.mutate({
      title,
      content: generatedContent,
      targetKeyword: targetKeyword.trim(),
      metaTitle: selectedTitle,
      metaDescription: selectedDescription,
    });
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast({ title: "Please enter an image prompt", variant: "destructive" });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await apiRequest("POST", "/api/images/generate", {
        prompt: imagePrompt.trim(),
        styleId: selectedImageStyleId !== "default" ? selectedImageStyleId : undefined,
        imageType: "featured",
        provider: imageProvider,
        aspectRatio: imageAspectRatio,
      });

      const data = await response.json();
      if (data.imageData) {
        setFeaturedImage(data.imageData);
        const providerName = imageProvider === "openai" ? "OpenAI" : "Gemini";
        toast({ title: `Featured image generated with ${providerName}` });
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast({ title: "Failed to generate image", variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGetImageSuggestions = async (target: "featured" | number) => {
    if (!generatedContent) {
      toast({ title: "Generate content first to get image suggestions", variant: "destructive" });
      return;
    }

    setSuggestionTarget(target);
    setIsLoadingImageSuggestions(true);
    setImageSuggestionsDialogOpen(true);

    try {
      const response = await apiRequest("POST", "/api/images/suggest", {
        content: generatedContent,
        targetKeyword: targetKeyword.trim(),
        count: 4,
        styleId: selectedImageStyleId !== "default" ? selectedImageStyleId : undefined,
      });

      const data = await response.json();
      setImageSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Image suggestions error:", error);
      toast({ title: "Failed to get image suggestions", variant: "destructive" });
      setImageSuggestionsDialogOpen(false);
    } finally {
      setIsLoadingImageSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: { title: string; prompt: string; placement: string }) => {
    if (suggestionTarget === "featured") {
      setImagePrompt(suggestion.prompt);
    } else {
      const newBlogImages = [...blogImages];
      if (newBlogImages[suggestionTarget]) {
        newBlogImages[suggestionTarget].prompt = suggestion.prompt;
      }
      setBlogImages(newBlogImages);
    }
    setImageSuggestionsDialogOpen(false);
  };

  const handleInsertImageIntoContent = async (imageUrl: string, imageType: "featured" | "blog", index?: number) => {
    if (!generatedContent) {
      toast({ title: "No content to insert image into", variant: "destructive" });
      return;
    }

    setIsInsertingImage(true);

    try {
      const response = await apiRequest("POST", "/api/images/find-placement", {
        content: generatedContent,
        imageUrl,
        imagePrompt: imageType === "featured" ? imagePrompt : blogImages[index || 0]?.prompt || "",
      });

      const data = await response.json();
      
      if (data.updatedContent) {
        setGeneratedContent(data.updatedContent);
        toast({ title: "Image inserted into article" });
      } else {
        toast({ title: "Could not find suitable placement", variant: "destructive" });
      }
    } catch (error) {
      console.error("Insert image error:", error);
      toast({ title: "Failed to insert image", variant: "destructive" });
    } finally {
      setIsInsertingImage(false);
    }
  };

  const handleGenerateSuggestion = async (suggestion: { title: string; prompt: string; placement: string }) => {
    setImageSuggestionsDialogOpen(false);
    
    if (suggestionTarget === "featured") {
      setImagePrompt(suggestion.prompt);
      setIsGeneratingImage(true);
      try {
        const response = await apiRequest("POST", "/api/images/generate", {
          prompt: suggestion.prompt,
          styleId: selectedImageStyleId !== "default" ? selectedImageStyleId : undefined,
          imageType: "featured",
          provider: imageProvider,
          aspectRatio: imageAspectRatio,
        });
        const data = await response.json();
        if (data.imageData) {
          setFeaturedImage(data.imageData);
          const providerName = imageProvider === "openai" ? "OpenAI" : "Gemini";
          toast({ title: `Featured image generated with ${providerName}` });
        }
      } catch (error) {
        toast({ title: "Failed to generate image", variant: "destructive" });
      } finally {
        setIsGeneratingImage(false);
      }
    } else {
      const idx = suggestionTarget as number;
      const newBlogImages = [...blogImages];
      if (!newBlogImages[idx]) {
        toast({ title: "Image slot not found", variant: "destructive" });
        return;
      }
      newBlogImages[idx] = { ...newBlogImages[idx], prompt: suggestion.prompt, isGenerating: true };
      setBlogImages(newBlogImages);

      try {
        const response = await apiRequest("POST", "/api/images/generate", {
          prompt: suggestion.prompt,
          styleId: newBlogImages[idx].styleId !== "default" ? newBlogImages[idx].styleId : undefined,
          imageType: "inline",
          provider: imageProvider,
          aspectRatio: imageAspectRatio,
        });
        const data = await response.json();
        if (data.imageData) {
          newBlogImages[idx] = { ...newBlogImages[idx], image: data.imageData, isGenerating: false };
          setBlogImages([...newBlogImages]);
          const providerName = imageProvider === "openai" ? "OpenAI" : "Gemini";
          toast({ title: `Blog image ${idx + 1} generated with ${providerName}` });
        }
      } catch (error) {
        newBlogImages[idx] = { ...newBlogImages[idx], isGenerating: false };
        setBlogImages([...newBlogImages]);
        toast({ title: "Failed to generate image", variant: "destructive" });
      }
    }
  };

  const handleGenerateBlogImage = async (index: number) => {
    const img = blogImages[index];
    if (!img) {
      toast({ title: "Image slot not found", variant: "destructive" });
      return;
    }
    if (!img.prompt?.trim()) {
      toast({ title: "Please enter an image prompt", variant: "destructive" });
      return;
    }

    const newBlogImages = [...blogImages];
    newBlogImages[index] = { ...newBlogImages[index], isGenerating: true };
    setBlogImages(newBlogImages);

    try {
      const response = await apiRequest("POST", "/api/images/generate", {
        prompt: img.prompt.trim(),
        styleId: img.styleId !== "default" ? img.styleId : undefined,
        imageType: "inline",
        provider: imageProvider,
        aspectRatio: imageAspectRatio,
      });

      const data = await response.json();
      if (data.imageData) {
        newBlogImages[index] = { ...newBlogImages[index], image: data.imageData, isGenerating: false };
        setBlogImages([...newBlogImages]);
        const providerName = imageProvider === "openai" ? "OpenAI" : "Gemini";
        toast({ title: `Blog image ${index + 1} generated with ${providerName}` });
      }
    } catch (error) {
      newBlogImages[index] = { ...newBlogImages[index], isGenerating: false };
      setBlogImages([...newBlogImages]);
      toast({ title: "Failed to generate image", variant: "destructive" });
    }
  };

  const handleBlogImageCountChange = (count: number) => {
    setBlogImageCount(count);
    const newImages = Array(count).fill(null).map((_, i) => 
      blogImages[i] || { image: "", prompt: "", styleId: "default", isGenerating: false }
    );
    setBlogImages(newImages);
  };

  const currentWordCount = stripHtmlTags(generatedContent).split(/\s+/).filter(Boolean).length;

  if (isEditMode && isLoadingArticle) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="page-create-loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-create">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {isEditMode ? "Edit Article" : "Create with AI"}
            </h1>
            {isEditMode && (
              <Badge variant="secondary" className="gap-1">
                <Pencil className="h-3 w-3" />
                Editing
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {isEditMode 
              ? "Update your article with AI-powered tools" 
              : "Generate SEO-optimized content using AI assistance"}
          </p>
        </div>
        {isEditMode && (
          <Select value={articleStatus} onValueChange={setArticleStatus}>
            <SelectTrigger className="w-[140px]" data-testid="select-article-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Generation Settings
              </CardTitle>
              <CardDescription>
                Configure how AI generates your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-keyword">Target Keyword *</Label>
                <Input
                  id="target-keyword"
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                  placeholder="e.g., psychic reading"
                  data-testid="input-target-keyword"
                />
                <p className="text-xs text-muted-foreground">
                  The primary keyword you want to rank for
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommended-keywords">Related Keywords</Label>
                <Textarea
                  id="recommended-keywords"
                  value={recommendedKeywords}
                  onChange={(e) => setRecommendedKeywords(e.target.value)}
                  placeholder="tarot reading, psychic advisor, spiritual guidance"
                  className="min-h-[80px]"
                  data-testid="input-recommended-keywords"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated keywords to include naturally
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="writing-style">Writing Style</Label>
                <Select value={selectedStyleId} onValueChange={setSelectedStyleId}>
                  <SelectTrigger data-testid="select-writing-style">
                    <SelectValue placeholder="Select a style..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    {writingStyles.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {writingStyles.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No custom styles defined.{" "}
                    <button 
                      className="text-primary underline"
                      onClick={() => setLocation("/settings")}
                    >
                      Create one in Settings
                    </button>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="word-count">Target Word Count</Label>
                <Input
                  id="word-count"
                  type="number"
                  min="100"
                  max="10000"
                  value={wordCount}
                  onChange={(e) => setWordCount(e.target.value)}
                  placeholder="e.g., 1500"
                  data-testid="input-word-count"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your desired word count (100-10,000)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-provider">AI Provider</Label>
                <Select value={contentProvider} onValueChange={(value: "anthropic" | "openai") => setContentProvider(value)}>
                  <SelectTrigger id="content-provider" data-testid="select-content-provider">
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Claude (Anthropic)</SelectItem>
                    <SelectItem value="openai">GPT-4o (OpenAI)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the AI model for content generation
                </p>
              </div>

              <Separator />

              {isGenerating ? (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleStopGeneration}
                  data-testid="button-stop-generation"
                >
                  <X className="h-4 w-4 mr-2" />
                  Stop Generation
                </Button>
              ) : (
                <Button 
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!targetKeyword.trim()}
                  data-testid="button-generate"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Content
                </Button>
              )}
            </CardContent>
          </Card>

          {generatedContent && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Meta Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedTitle && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Selected Title</Label>
                    <p className="text-sm">{selectedTitle}</p>
                  </div>
                )}
                {selectedDescription && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Selected Description</Label>
                    <p className="text-sm">{selectedDescription}</p>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleGenerateMetaSuggestions}
                  data-testid="button-meta-suggestions"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {selectedTitle ? "Regenerate" : "Generate"} Meta Suggestions
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Featured Image
              </CardTitle>
              <CardDescription>
                Generate a hero image for your article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image-provider">AI Provider</Label>
                  <Select value={imageProvider} onValueChange={(value: "gemini" | "openai") => setImageProvider(value)}>
                    <SelectTrigger id="image-provider" data-testid="select-image-provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Gemini (Nano Banana)</SelectItem>
                      <SelectItem value="openai">OpenAI (GPT Image)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-style">Image Style</Label>
                  <Select value={selectedImageStyleId} onValueChange={setSelectedImageStyleId}>
                    <SelectTrigger id="image-style" data-testid="select-image-style">
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
                  <Label htmlFor="image-aspect-ratio">Aspect Ratio</Label>
                  <Select value={imageAspectRatio} onValueChange={setImageAspectRatio}>
                    <SelectTrigger id="image-aspect-ratio" data-testid="select-image-aspect-ratio">
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
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="image-prompt">Image Prompt</Label>
                  <div className="flex items-center gap-1">
                    {generatedContent && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleGetImageSuggestions("featured")}
                        disabled={isLoadingImageSuggestions}
                        data-testid="button-ai-suggestions"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Suggest
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  id="image-prompt"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="min-h-[80px]"
                  data-testid="input-image-prompt"
                />
              </div>

              <Button 
                className="w-full"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                data-testid="button-generate-image"
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

              {featuredImage && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Generated Image</Label>
                  <div className="rounded-md overflow-hidden border">
                    <img 
                      src={featuredImage} 
                      alt="Generated featured image" 
                      className="w-full h-auto"
                      data-testid="img-featured"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    data-testid="button-regenerate-image"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Blog Images
              </CardTitle>
              <CardDescription>
                Generate images to use throughout your article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blog-image-count">Number of Images</Label>
                  <Select value={String(blogImageCount)} onValueChange={(v) => handleBlogImageCountChange(parseInt(v))}>
                    <SelectTrigger id="blog-image-count" data-testid="select-blog-image-count">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} image{n > 1 ? "s" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-image-provider">AI Provider</Label>
                  <Select value={imageProvider} onValueChange={(value: "gemini" | "openai") => setImageProvider(value)}>
                    <SelectTrigger id="blog-image-provider" data-testid="select-blog-image-provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Gemini (Nano Banana)</SelectItem>
                      <SelectItem value="openai">OpenAI (GPT Image)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-image-aspect-ratio">Aspect Ratio</Label>
                  <Select value={imageAspectRatio} onValueChange={setImageAspectRatio}>
                    <SelectTrigger id="blog-image-aspect-ratio" data-testid="select-blog-image-aspect-ratio">
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

              <Separator />

              {blogImages.map((img, index) => (
                <div key={index} className="space-y-3 p-3 border rounded-md">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="font-medium">Image {index + 1}</Label>
                    {generatedContent && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleGetImageSuggestions(index)}
                        disabled={isLoadingImageSuggestions}
                        data-testid={`button-ai-suggest-${index}`}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Suggest
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Style</Label>
                    <Select 
                      value={img.styleId} 
                      onValueChange={(v) => {
                        const newImages = [...blogImages];
                        newImages[index] = { ...newImages[index], styleId: v };
                        setBlogImages(newImages);
                      }}
                    >
                      <SelectTrigger data-testid={`select-blog-style-${index}`}>
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
                    <Label className="text-xs text-muted-foreground">Prompt</Label>
                    <Textarea
                      value={img.prompt}
                      onChange={(e) => {
                        const newImages = [...blogImages];
                        newImages[index] = { ...newImages[index], prompt: e.target.value };
                        setBlogImages(newImages);
                      }}
                      placeholder="Describe this image..."
                      className="min-h-[60px]"
                      data-testid={`input-blog-prompt-${index}`}
                    />
                  </div>

                  <Button 
                    size="sm"
                    className="w-full"
                    onClick={() => handleGenerateBlogImage(index)}
                    disabled={img.isGenerating || !img.prompt?.trim()}
                    data-testid={`button-generate-blog-${index}`}
                  >
                    {img.isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>

                  {img.image && (
                    <div className="space-y-2">
                      <div className="rounded-md overflow-hidden border">
                        <img 
                          src={img.image} 
                          alt={`Blog image ${index + 1}`} 
                          className="w-full h-auto"
                          data-testid={`img-blog-${index}`}
                        />
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleInsertImageIntoContent(img.image, "blog", index)}
                        disabled={isInsertingImage || !generatedContent}
                        data-testid={`button-insert-blog-image-${index}`}
                      >
                        {isInsertingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Inserting...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Insert into Article
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Generated Content</CardTitle>
                  {generatedContent && (
                    <Badge variant="secondary">
                      {currentWordCount.toLocaleString()} words
                    </Badge>
                  )}
                </div>
                {generatedContent && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopyContent}
                      data-testid="button-copy"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      data-testid="button-regenerate"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                      Regenerate
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSaveAsDraft}
                      disabled={saveArticleMutation.isPending}
                      data-testid="button-save-draft"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save as Draft
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {isGenerating && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Generating content...</span>
                    <span className="font-mono">{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} />
                </div>
              )}
              
              {generatedContent ? (
                <div data-testid="text-generated-content">
                  <TiptapEditor 
                    content={generatedContent}
                    onChange={(html) => setGeneratedContent(html)}
                    editable={true}
                  />
                </div>
              ) : (
                <div className="h-[600px] flex items-center justify-center text-center">
                  <div className="max-w-md">
                    <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Ready to Create</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your target keyword and click "Generate Content" to create 
                      SEO-optimized content with AI assistance.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={metaDialogOpen} onOpenChange={setMetaDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Meta Tag Suggestions</DialogTitle>
            <DialogDescription>
              Select a meta title and description for your content
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingMeta ? (
            <div className="py-8 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generating suggestions...</p>
            </div>
          ) : metaSuggestions ? (
            <div className="space-y-6 py-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                <Label>Meta Titles</Label>
                <div className="space-y-2">
                  {metaSuggestions.titles.map((title, i) => (
                    <div 
                      key={i}
                      className={`p-3 rounded-md border cursor-pointer transition-colors hover-elevate ${
                        selectedTitle === title ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedTitle(title)}
                      data-testid={`meta-title-option-${i}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center ${
                          selectedTitle === title ? "border-primary bg-primary" : ""
                        }`}>
                          {selectedTitle === title && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {title.length} / {seoSettings?.metaTitleMaxLength || 60} characters
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Meta Descriptions</Label>
                <div className="space-y-2">
                  {metaSuggestions.descriptions.map((desc, i) => (
                    <div 
                      key={i}
                      className={`p-3 rounded-md border cursor-pointer transition-colors hover-elevate ${
                        selectedDescription === desc ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedDescription(desc)}
                      data-testid={`meta-desc-option-${i}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center ${
                          selectedDescription === desc ? "border-primary bg-primary" : ""
                        }`}>
                          {selectedDescription === desc && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{desc}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {desc.length} / {seoSettings?.metaDescriptionMaxLength || 160} characters
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setMetaDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => setMetaDialogOpen(false)}
              disabled={!selectedTitle && !selectedDescription}
            >
              Apply Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageSuggestionsDialogOpen} onOpenChange={setImageSuggestionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Image Suggestions</DialogTitle>
            <DialogDescription>
              {suggestionTarget === "featured" 
                ? "Choose a suggested image for your featured hero image"
                : `Choose a suggested image for Blog Image ${(suggestionTarget as number) + 1}`
              }
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingImageSuggestions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : imageSuggestions.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {imageSuggestions.map((suggestion, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-md border space-y-2"
                  data-testid={`image-suggestion-${i}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{suggestion.title}</p>
                      <Badge variant="secondary" className="mt-1">
                        {suggestion.placement}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.prompt}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      size="sm"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      data-testid={`button-use-prompt-${i}`}
                    >
                      Use This Prompt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No suggestions available
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setImageSuggestionsDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
