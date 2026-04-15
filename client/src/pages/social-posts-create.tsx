import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Wand2,
  ImageIcon,
  Check,
  Send,
  Save,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { apiRequest, authFetch } from "@/lib/queryClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Slide {
  title: string;
  body: string;
  templateType?: string;
  imageUrl?: string;
  imagePrompt?: string;
}

interface PostFormData {
  type: "single" | "carousel";
  platform: "instagram" | "tiktok" | "both";
  slideCount: number;
  carouselTypeId?: string;
  templateSetId?: string;
  topic: string;
  caption: string;
  hashtags: string;
  slides: Slide[];
  status?: string;
}

interface CarouselType {
  id: string;
  name: string;
  description?: string;
}

interface TemplateSet {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
}

interface TopicSuggestion {
  topic: string;
}

interface MediaItem {
  id: string;
  url: string;
  name?: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  name: string;
  username?: string;
}

// ---------------------------------------------------------------------------
// Steps configuration
// ---------------------------------------------------------------------------

const STEPS = [
  { label: "Type & Platform", number: 1 },
  { label: "Style", number: 2 },
  { label: "Topic", number: 3 },
  { label: "Content", number: 4 },
  { label: "Images", number: 5 },
  { label: "Preview & Publish", number: 6 },
];

// ---------------------------------------------------------------------------
// Stepper component
// ---------------------------------------------------------------------------

function Stepper({
  currentStep,
  completedSteps,
}: {
  currentStep: number;
  completedSteps: Set<number>;
}) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.number;
          const isCompleted = completedSteps.has(step.number);
          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                    isCompleted
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : isActive
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                      : "border-gray-300 text-gray-400 bg-white"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                    isActive
                      ? "text-indigo-600"
                      : isCompleted
                      ? "text-indigo-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-1rem] ${
                    completedSteps.has(step.number) ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SocialPostsCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine edit mode from URL
  const pathParts = window.location.pathname.split("/");
  const editId =
    pathParts.includes("edit") ? pathParts[pathParts.indexOf("edit") + 1] : null;
  const isEditMode = !!editId;

  // ---------------------------------------------------------------------------
  // Wizard state
  // ---------------------------------------------------------------------------

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Form data
  const [formData, setFormData] = useState<PostFormData>({
    type: "carousel",
    platform: "instagram",
    slideCount: 5,
    topic: "",
    caption: "",
    hashtags: "",
    slides: [],
  });

  // Topic suggestions
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);

  // Image generation progress
  const [generatingImageIdx, setGeneratingImageIdx] = useState<number | null>(null);
  const [generatingAllImages, setGeneratingAllImages] = useState(false);
  const [allImagesProgress, setAllImagesProgress] = useState(0);

  // Dialogs
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [mediaLibrarySlideIdx, setMediaLibrarySlideIdx] = useState<number>(0);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");

  // Debounced auto-save timer
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  // Load existing post for edit mode
  const { data: existingPost } = useQuery({
    queryKey: ["/api/social-posts", editId],
    queryFn: () => authFetch(`/api/social-posts/${editId}`).then((r) => r.json()),
    enabled: isEditMode,
  });

  // Carousel types
  const { data: carouselTypes } = useQuery<CarouselType[]>({
    queryKey: ["/api/social-posts/carousel-types"],
    queryFn: () =>
      authFetch("/api/social-posts/carousel-types").then((r) => r.json()),
  });

  // Template sets
  const { data: templateSets } = useQuery<TemplateSet[]>({
    queryKey: ["/api/social-posts/templates"],
    queryFn: () => authFetch("/api/social-posts/templates").then((r) => r.json()),
  });

  // Media library
  const { data: mediaLibrary } = useQuery<MediaItem[]>({
    queryKey: ["/api/social-posts/media-library"],
    queryFn: () =>
      authFetch("/api/social-posts/media-library").then((r) => r.json()),
    enabled: mediaLibraryOpen,
  });

  // Social accounts (for publish dialog)
  const { data: socialAccounts } = useQuery<SocialAccount[]>({
    queryKey: ["/api/social-posts/social-accounts"],
    queryFn: () =>
      authFetch("/api/social-posts/social-accounts").then((r) => r.json()),
    enabled: publishDialogOpen,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const generateTopicsMutation = useMutation({
    mutationFn: (body: { carouselTypeId?: string }) =>
      apiRequest("POST", "/api/social-posts/generate-topics", body).then((r) =>
        r.json(),
      ),
    onSuccess: (data: { topics: string[] } | string[]) => {
      const topics = Array.isArray(data) ? data : data.topics ?? [];
      setTopicSuggestions(topics);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate topics", variant: "destructive" });
    },
  });

  const generateContentMutation = useMutation({
    mutationFn: (body: {
      topic: string;
      slideCount: number;
      carouselTypeId?: string;
      type: string;
    }) =>
      apiRequest("POST", "/api/social-posts/generate-content", body).then((r) =>
        r.json(),
      ),
    onSuccess: (data: any) => {
      setFormData((prev) => ({
        ...prev,
        caption: data.caption ?? prev.caption,
        hashtags: data.hashtags ?? prev.hashtags,
        slides: data.slides ?? prev.slides,
      }));
      toast({ title: "Content generated", description: "AI content has been generated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate content", variant: "destructive" });
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: (body: { slideIndex: number; prompt: string; postId?: string }) =>
      apiRequest("POST", "/api/social-posts/generate-image", body).then((r) =>
        r.json(),
      ),
  });

  const renderAllMutation = useMutation({
    mutationFn: (body: { postId?: string; slides: Slide[] }) =>
      apiRequest("POST", "/api/social-posts/render-all", body).then((r) =>
        r.json(),
      ),
    onSuccess: (data: any) => {
      if (data.slides) {
        setFormData((prev) => ({ ...prev, slides: data.slides }));
      }
      toast({ title: "Rendered", description: "All slides have been rendered." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to render slides", variant: "destructive" });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: (body: PostFormData & { id?: string }) => {
      const url = body.id
        ? `/api/social-posts/${body.id}`
        : "/api/social-posts";
      const method = body.id ? "PATCH" : "POST";
      return apiRequest(method, url, { ...body, status: "draft" }).then((r) =>
        r.json(),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts"] });
      toast({ title: "Saved", description: "Draft has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save draft", variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (body: {
      post: PostFormData;
      accountIds: string[];
      scheduledAt?: string;
      id?: string;
    }) =>
      apiRequest("POST", "/api/social-posts/publish", body).then((r) =>
        r.json(),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts"] });
      toast({ title: "Published", description: "Post has been published successfully." });
      setPublishDialogOpen(false);
      setLocation("/social-posts");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to publish post", variant: "destructive" });
    },
  });

  // ---------------------------------------------------------------------------
  // Populate form with existing post data (edit mode)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (existingPost && isEditMode) {
      setFormData({
        type: existingPost.type ?? "carousel",
        platform: existingPost.platform ?? "instagram",
        slideCount: existingPost.slideCount ?? 5,
        carouselTypeId: existingPost.carouselTypeId,
        templateSetId: existingPost.templateSetId,
        topic: existingPost.topic ?? "",
        caption: existingPost.caption ?? "",
        hashtags: existingPost.hashtags ?? "",
        slides: existingPost.slides ?? [],
        status: existingPost.status,
      });
    }
  }, [existingPost, isEditMode]);

  // ---------------------------------------------------------------------------
  // Auto-save draft (debounced) on step 4+
  // ---------------------------------------------------------------------------

  const autoSave = useCallback(() => {
    if (currentStep >= 4 && formData.topic) {
      saveDraftMutation.mutate({ ...formData, id: editId ?? undefined });
    }
  }, [formData, currentStep, editId]);

  useEffect(() => {
    if (currentStep < 4) return;
    if (saveTimer) clearTimeout(saveTimer);
    const timer = setTimeout(autoSave, 2000);
    setSaveTimer(timer);
    return () => clearTimeout(timer);
  }, [formData.caption, formData.hashtags, formData.slides]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const updateFormData = <K extends keyof PostFormData>(
    key: K,
    value: PostFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSlide = (index: number, field: keyof Slide, value: string) => {
    setFormData((prev) => {
      const slides = [...prev.slides];
      slides[index] = { ...slides[index], [field]: value };
      return { ...prev, slides };
    });
  };

  const addSlide = () => {
    setFormData((prev) => ({
      ...prev,
      slides: [...prev.slides, { title: "", body: "", imagePrompt: "" }],
      slideCount: prev.slideCount + 1,
    }));
  };

  const removeSlide = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index),
      slideCount: Math.max(1, prev.slideCount - 1),
    }));
  };

  const goNext = () => {
    setCompletedSteps((prev) => { const next = new Set(Array.from(prev)); next.add(currentStep); return next; });
    setCurrentStep((s) => Math.min(s + 1, 6));
  };

  const goBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  // Generate a single slide image
  const handleGenerateImage = async (index: number) => {
    const prompt = formData.slides[index]?.imagePrompt || formData.slides[index]?.title || "";
    if (!prompt) {
      toast({ title: "No prompt", description: "Please provide an image prompt.", variant: "destructive" });
      return;
    }
    setGeneratingImageIdx(index);
    try {
      const result = await generateImageMutation.mutateAsync({
        slideIndex: index,
        prompt,
        postId: editId ?? undefined,
      });
      updateSlide(index, "imageUrl", result.imageUrl ?? result.url ?? "");
      toast({ title: "Image generated", description: `Slide ${index + 1} image ready.` });
    } catch {
      toast({ title: "Error", description: `Failed to generate image for slide ${index + 1}`, variant: "destructive" });
    } finally {
      setGeneratingImageIdx(null);
    }
  };

  // Generate all slide images sequentially
  const handleGenerateAllImages = async () => {
    setGeneratingAllImages(true);
    setAllImagesProgress(0);
    for (let i = 0; i < formData.slides.length; i++) {
      const prompt =
        formData.slides[i]?.imagePrompt || formData.slides[i]?.title || "";
      if (!prompt) continue;
      setGeneratingImageIdx(i);
      try {
        const result = await generateImageMutation.mutateAsync({
          slideIndex: i,
          prompt,
          postId: editId ?? undefined,
        });
        updateSlide(i, "imageUrl", result.imageUrl ?? result.url ?? "");
      } catch {
        // continue with next slide
      }
      setAllImagesProgress(Math.round(((i + 1) / formData.slides.length) * 100));
    }
    setGeneratingImageIdx(null);
    setGeneratingAllImages(false);
    toast({ title: "Done", description: "All slide images have been generated." });
  };

  // Pick media from library
  const handlePickMedia = (item: MediaItem) => {
    updateSlide(mediaLibrarySlideIdx, "imageUrl", item.url);
    setMediaLibraryOpen(false);
  };

  // Publish handler
  const handlePublish = () => {
    if (selectedAccounts.length === 0) {
      toast({ title: "Select accounts", description: "Choose at least one account.", variant: "destructive" });
      return;
    }
    publishMutation.mutate({
      post: formData,
      accountIds: selectedAccounts,
      scheduledAt: scheduledDate || undefined,
      id: editId ?? undefined,
    });
  };

  // Count rendered images
  const renderedCount = formData.slides.filter((s) => !!s.imageUrl).length;

  // ---------------------------------------------------------------------------
  // Step renderers
  // ---------------------------------------------------------------------------

  // Step 1: Type & Platform
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Post type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Post Type</Label>
        <div className="flex gap-3">
          {(["single", "carousel"] as const).map((t) => (
            <Button
              key={t}
              variant={formData.type === t ? "default" : "outline"}
              onClick={() => updateFormData("type", t)}
              className="flex-1 capitalize"
            >
              {t === "single" ? "Single Image" : "Carousel"}
            </Button>
          ))}
        </div>
      </div>

      {/* Platform */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Platform</Label>
        <Select
          value={formData.platform}
          onValueChange={(val) =>
            updateFormData("platform", val as PostFormData["platform"])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Slide count (carousel only) */}
      {formData.type === "carousel" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Slide Count: {formData.slideCount}
          </Label>
          <Slider
            min={3}
            max={10}
            step={1}
            value={[formData.slideCount]}
            onValueChange={([val]) => updateFormData("slideCount", val)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3</span>
            <span>10</span>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={goNext}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Step 2: Style
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Carousel type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Carousel Type <span className="text-muted-foreground">(optional)</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {carouselTypes?.map((ct) => (
            <Card
              key={ct.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                formData.carouselTypeId === ct.id
                  ? "ring-2 ring-indigo-600 shadow-md"
                  : ""
              }`}
              onClick={() =>
                updateFormData(
                  "carouselTypeId",
                  formData.carouselTypeId === ct.id ? undefined : ct.id,
                )
              }
            >
              <CardContent className="p-4">
                <p className="font-medium text-sm">{ct.name}</p>
                {ct.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {ct.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {!carouselTypes?.length && (
            <p className="text-sm text-muted-foreground col-span-full">
              No carousel types available.
            </p>
          )}
        </div>
      </div>

      {/* Template set */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Template Set <span className="text-muted-foreground">(optional)</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {templateSets?.map((ts) => (
            <Card
              key={ts.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                formData.templateSetId === ts.id
                  ? "ring-2 ring-indigo-600 shadow-md"
                  : ""
              }`}
              onClick={() =>
                updateFormData(
                  "templateSetId",
                  formData.templateSetId === ts.id ? undefined : ts.id,
                )
              }
            >
              <CardContent className="p-4">
                {ts.thumbnail && (
                  <img
                    src={ts.thumbnail}
                    alt={ts.name}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                )}
                <p className="font-medium text-sm">{ts.name}</p>
                {ts.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {ts.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {!templateSets?.length && (
            <p className="text-sm text-muted-foreground col-span-full">
              No template sets available.
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={goNext}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Step 3: Topic
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Topic</Label>
        <Input
          placeholder="Enter your topic..."
          value={formData.topic}
          onChange={(e) => updateFormData("topic", e.target.value)}
        />
      </div>

      <Button
        variant="outline"
        onClick={() =>
          generateTopicsMutation.mutate({
            carouselTypeId: formData.carouselTypeId,
          })
        }
        disabled={generateTopicsMutation.isPending}
      >
        {generateTopicsMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Get AI Topic Suggestions
      </Button>

      {/* Topic suggestions */}
      {topicSuggestions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Suggestions</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {topicSuggestions.map((topic, idx) => (
              <Card
                key={idx}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  formData.topic === topic
                    ? "ring-2 ring-indigo-600 shadow-md"
                    : ""
                }`}
                onClick={() => updateFormData("topic", topic)}
              >
                <CardContent className="p-3">
                  <p className="text-sm">{topic}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={goNext} disabled={!formData.topic}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Step 4: Content
  const renderStep4 = () => (
    <div className="space-y-6">
      <Button
        onClick={() =>
          generateContentMutation.mutate({
            topic: formData.topic,
            slideCount: formData.slideCount,
            carouselTypeId: formData.carouselTypeId,
            type: formData.type,
          })
        }
        disabled={generateContentMutation.isPending}
      >
        {generateContentMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-4 w-4" />
        )}
        Generate Content with AI
      </Button>

      {/* Caption */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Caption</Label>
        <Textarea
          placeholder="Write your caption..."
          value={formData.caption}
          onChange={(e) => updateFormData("caption", e.target.value)}
          rows={4}
        />
      </div>

      {/* Hashtags */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Hashtags</Label>
        <Textarea
          placeholder="#example #hashtags"
          value={formData.hashtags}
          onChange={(e) => updateFormData("hashtags", e.target.value)}
          rows={2}
        />
      </div>

      {/* Slides */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Slides ({formData.slides.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addSlide}>
            <Plus className="mr-1 h-3 w-3" /> Add Slide
          </Button>
        </div>

        {formData.slides.map((slide, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                Slide {idx + 1}
                {slide.templateType && (
                  <Badge variant="secondary" className="ml-2">
                    {slide.templateType}
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSlide(idx)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input
                  value={slide.title}
                  onChange={(e) => updateSlide(idx, "title", e.target.value)}
                  placeholder="Slide title..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Body</Label>
                <Textarea
                  value={slide.body}
                  onChange={(e) => updateSlide(idx, "body", e.target.value)}
                  placeholder="Slide body text..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={goNext}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Step 5: Images
  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerateAllImages}
          disabled={generatingAllImages || formData.slides.length === 0}
        >
          {generatingAllImages ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating ({allImagesProgress}%)
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate All with AI
            </>
          )}
        </Button>
        {generatingAllImages && (
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${allImagesProgress}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formData.slides.map((slide, idx) => {
          const isGenerating = generatingImageIdx === idx;
          return (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Slide {idx + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Thumbnail / placeholder */}
                <div className="w-full h-40 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                  {slide.imageUrl ? (
                    <img
                      src={slide.imageUrl}
                      alt={`Slide ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>

                {/* Image prompt */}
                <div className="space-y-1">
                  <Label className="text-xs">Image Prompt</Label>
                  <Textarea
                    value={slide.imagePrompt ?? ""}
                    onChange={(e) =>
                      updateSlide(idx, "imagePrompt", e.target.value)
                    }
                    placeholder="Describe the image..."
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateImage(idx)}
                    disabled={isGenerating || generatingAllImages}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="mr-1 h-3 w-3" />
                    )}
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMediaLibrarySlideIdx(idx);
                      setMediaLibraryOpen(true);
                    }}
                    disabled={generatingAllImages}
                  >
                    <ImageIcon className="mr-1 h-3 w-3" />
                    Pick from Library
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {formData.slides.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No slides yet. Go back to the Content step to add slides.
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={goNext}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Step 6: Preview & Publish
  const renderStep6 = () => (
    <div className="space-y-6">
      {/* Carousel preview */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Slide Preview</Label>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {formData.slides.map((slide, idx) => (
            <div
              key={idx}
              className="min-w-[200px] max-w-[200px] rounded-lg border bg-card overflow-hidden flex-shrink-0"
            >
              <div className="h-32 bg-muted flex items-center justify-center">
                {slide.imageUrl ? (
                  <img
                    src={slide.imageUrl}
                    alt={`Slide ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">
                  {slide.title || `Slide ${idx + 1}`}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {slide.body}
                </p>
              </div>
            </div>
          ))}
          {formData.slides.length === 0 && (
            <p className="text-sm text-muted-foreground py-8">No slides to preview.</p>
          )}
        </div>
      </div>

      {/* Render all */}
      <Button
        variant="outline"
        onClick={() =>
          renderAllMutation.mutate({
            postId: editId ?? undefined,
            slides: formData.slides,
          })
        }
        disabled={renderAllMutation.isPending}
      >
        {renderAllMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="mr-2 h-4 w-4" />
        )}
        Render All Slides
      </Button>

      {/* Caption / hashtags editing */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Caption</Label>
        <Textarea
          value={formData.caption}
          onChange={(e) => updateFormData("caption", e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Hashtags</Label>
        <Textarea
          value={formData.hashtags}
          onChange={(e) => updateFormData("hashtags", e.target.value)}
          rows={2}
        />
      </div>

      {/* Summary stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm font-medium capitalize">{formData.type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Platform</p>
              <p className="text-sm font-medium capitalize">{formData.platform}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Slides</p>
              <p className="text-sm font-medium">{formData.slides.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Images Rendered</p>
              <p className="text-sm font-medium">
                {renderedCount} / {formData.slides.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation + actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() =>
              saveDraftMutation.mutate({ ...formData, id: editId ?? undefined })
            }
            disabled={saveDraftMutation.isPending}
          >
            {saveDraftMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save as Draft
          </Button>
          <Button onClick={() => setPublishDialogOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Step router
  // ---------------------------------------------------------------------------

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Social Post" : "Create Social Post"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditMode
            ? "Update your social media post."
            : "Create a new social media post step by step."}
        </p>
      </div>

      {/* Stepper */}
      <Stepper currentStep={currentStep} completedSteps={completedSteps} />

      {/* Current step content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].label}</CardTitle>
        </CardHeader>
        <CardContent>{renderCurrentStep()}</CardContent>
      </Card>

      {/* ------------------------------------------------------------------- */}
      {/* Media Library Dialog                                                 */}
      {/* ------------------------------------------------------------------- */}
      <Dialog open={mediaLibraryOpen} onOpenChange={setMediaLibraryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1">
            {mediaLibrary?.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer rounded-md overflow-hidden border hover:ring-2 hover:ring-indigo-600 transition-all"
                onClick={() => handlePickMedia(item)}
              >
                <img
                  src={item.url}
                  alt={item.name ?? "Media"}
                  className="w-full h-24 object-cover"
                />
                {item.name && (
                  <p className="text-xs p-1 truncate">{item.name}</p>
                )}
              </div>
            ))}
            {!mediaLibrary?.length && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                No media items found.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------- */}
      {/* Publish Dialog                                                       */}
      {/* ------------------------------------------------------------------- */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Account selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Accounts</Label>
              {socialAccounts?.map((acct) => (
                <div key={acct.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`acct-${acct.id}`}
                    checked={selectedAccounts.includes(acct.id)}
                    onCheckedChange={(checked) => {
                      setSelectedAccounts((prev) =>
                        checked
                          ? [...prev, acct.id]
                          : prev.filter((id) => id !== acct.id),
                      );
                    }}
                  />
                  <label
                    htmlFor={`acct-${acct.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {acct.name}
                    {acct.username && (
                      <span className="text-muted-foreground ml-1">
                        @{acct.username}
                      </span>
                    )}
                    <Badge variant="secondary" className="ml-2 capitalize">
                      {acct.platform}
                    </Badge>
                  </label>
                </div>
              ))}
              {!socialAccounts?.length && (
                <p className="text-sm text-muted-foreground">
                  No social accounts connected.
                </p>
              )}
            </div>

            {/* Scheduled date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Schedule <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setPublishDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {scheduledDate ? "Schedule" : "Publish Now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
