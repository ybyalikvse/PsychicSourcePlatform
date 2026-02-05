import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Save, Globe, Bell, Shield, Palette, PenTool, Search, Plus, Edit2, Trash2, Image, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WritingStyle, SeoSettings as SeoSettingsType, ImageStyle, TargetAudience, LinkTableColumn, OptimizationPrompt } from "@shared/schema";
import { Copy, Target } from "lucide-react";

interface WritingStyleFormData {
  name: string;
  tone: string;
  guidelines: string;
  exampleText: string;
}

interface ImageStyleFormData {
  name: string;
  description: string;
  stylePrompt: string;
  additionalInstructions: string;
}

interface SeoSettingsFormData {
  metaTitleGuidelines: string;
  metaTitleMaxLength: number;
  metaDescriptionGuidelines: string;
  metaDescriptionMaxLength: number;
}

interface OptimizationPromptFormData {
  name: string;
  description: string;
  prompt: string;
  promptType: "analysis" | "direct";
  isDefault: boolean;
}

interface TargetAudienceFormData {
  name: string;
  description: string;
  demographics: string;
  painPoints: string;
  goals: string;
  tone: string;
}

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [siteUrl, setSiteUrl] = useState("https://www.psychicsource.com");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState("10");
  
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<WritingStyle | null>(null);
  const [styleForm, setStyleForm] = useState<WritingStyleFormData>({
    name: "",
    tone: "professional",
    guidelines: "",
    exampleText: "",
  });

  const [imageStyleDialogOpen, setImageStyleDialogOpen] = useState(false);
  const [editingImageStyle, setEditingImageStyle] = useState<ImageStyle | null>(null);
  const [imageStyleForm, setImageStyleForm] = useState<ImageStyleFormData>({
    name: "",
    description: "",
    stylePrompt: "",
    additionalInstructions: "",
  });

  const [audienceDialogOpen, setAudienceDialogOpen] = useState(false);
  const [editingAudience, setEditingAudience] = useState<TargetAudience | null>(null);
  const [audienceForm, setAudienceForm] = useState<TargetAudienceFormData>({
    name: "",
    description: "",
    demographics: "",
    painPoints: "",
    goals: "",
    tone: "",
  });

  const [optimizationPromptDialogOpen, setOptimizationPromptDialogOpen] = useState(false);
  const [editingOptimizationPrompt, setEditingOptimizationPrompt] = useState<OptimizationPrompt | null>(null);
  const [optimizationPromptForm, setOptimizationPromptForm] = useState<OptimizationPromptFormData>({
    name: "",
    description: "",
    prompt: "",
    promptType: "analysis",
    isDefault: false,
  });

  const { data: writingStyles = [], isLoading: stylesLoading } = useQuery<WritingStyle[]>({
    queryKey: ["/api/writing-styles"],
  });

  const { data: imageStyles = [], isLoading: imageStylesLoading } = useQuery<ImageStyle[]>({
    queryKey: ["/api/image-styles"],
  });

  const { data: targetAudiences = [], isLoading: audiencesLoading } = useQuery<TargetAudience[]>({
    queryKey: ["/api/target-audiences"],
  });

  const { data: linkColumns = [] } = useQuery<LinkTableColumn[]>({
    queryKey: ["/api/link-table-columns"],
  });

  const { data: optimizationPrompts = [], isLoading: optimizationPromptsLoading } = useQuery<OptimizationPrompt[]>({
    queryKey: ["/api/optimization-prompts"],
  });

  const { data: seoSettings, isLoading: seoLoading } = useQuery<SeoSettingsType>({
    queryKey: ["/api/seo-settings"],
  });

  const [seoForm, setSeoForm] = useState<SeoSettingsFormData>({
    metaTitleGuidelines: "",
    metaTitleMaxLength: 60,
    metaDescriptionGuidelines: "",
    metaDescriptionMaxLength: 160,
  });

  useEffect(() => {
    if (seoSettings) {
      setSeoForm({
        metaTitleGuidelines: seoSettings.metaTitleGuidelines || "",
        metaTitleMaxLength: seoSettings.metaTitleMaxLength || 60,
        metaDescriptionGuidelines: seoSettings.metaDescriptionGuidelines || "",
        metaDescriptionMaxLength: seoSettings.metaDescriptionMaxLength || 160,
      });
    }
  }, [seoSettings]);

  const createStyleMutation = useMutation({
    mutationFn: (data: WritingStyleFormData) => 
      apiRequest("POST", "/api/writing-styles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writing-styles"] });
      setStyleDialogOpen(false);
      resetStyleForm();
      toast({ title: "Writing style created" });
    },
    onError: () => {
      toast({ title: "Failed to create writing style", variant: "destructive" });
    },
  });

  const updateStyleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WritingStyleFormData> }) => 
      apiRequest("PATCH", `/api/writing-styles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writing-styles"] });
      setStyleDialogOpen(false);
      setEditingStyle(null);
      resetStyleForm();
      toast({ title: "Writing style updated" });
    },
    onError: () => {
      toast({ title: "Failed to update writing style", variant: "destructive" });
    },
  });

  const deleteStyleMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/writing-styles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writing-styles"] });
      toast({ title: "Writing style deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete writing style", variant: "destructive" });
    },
  });

  const createImageStyleMutation = useMutation({
    mutationFn: (data: ImageStyleFormData) => 
      apiRequest("POST", "/api/image-styles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/image-styles"] });
      setImageStyleDialogOpen(false);
      resetImageStyleForm();
      toast({ title: "Image style created" });
    },
    onError: () => {
      toast({ title: "Failed to create image style", variant: "destructive" });
    },
  });

  const updateImageStyleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ImageStyleFormData> }) => 
      apiRequest("PATCH", `/api/image-styles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/image-styles"] });
      setImageStyleDialogOpen(false);
      setEditingImageStyle(null);
      resetImageStyleForm();
      toast({ title: "Image style updated" });
    },
    onError: () => {
      toast({ title: "Failed to update image style", variant: "destructive" });
    },
  });

  const deleteImageStyleMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/image-styles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/image-styles"] });
      toast({ title: "Image style deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete image style", variant: "destructive" });
    },
  });

  const createAudienceMutation = useMutation({
    mutationFn: (data: TargetAudienceFormData) => 
      apiRequest("POST", "/api/target-audiences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/target-audiences"] });
      setAudienceDialogOpen(false);
      resetAudienceForm();
      toast({ title: "Target audience created" });
    },
    onError: () => {
      toast({ title: "Failed to create target audience", variant: "destructive" });
    },
  });

  const updateAudienceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TargetAudienceFormData> }) => 
      apiRequest("PATCH", `/api/target-audiences/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/target-audiences"] });
      setAudienceDialogOpen(false);
      setEditingAudience(null);
      resetAudienceForm();
      toast({ title: "Target audience updated" });
    },
    onError: () => {
      toast({ title: "Failed to update target audience", variant: "destructive" });
    },
  });

  const deleteAudienceMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/target-audiences/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/target-audiences"] });
      toast({ title: "Target audience deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete target audience", variant: "destructive" });
    },
  });

  const createOptimizationPromptMutation = useMutation({
    mutationFn: (data: OptimizationPromptFormData) => 
      apiRequest("POST", "/api/optimization-prompts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/optimization-prompts"] });
      setOptimizationPromptDialogOpen(false);
      resetOptimizationPromptForm();
      toast({ title: "Optimization prompt created" });
    },
    onError: () => {
      toast({ title: "Failed to create optimization prompt", variant: "destructive" });
    },
  });

  const updateOptimizationPromptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OptimizationPromptFormData> }) => 
      apiRequest("PATCH", `/api/optimization-prompts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/optimization-prompts"] });
      setOptimizationPromptDialogOpen(false);
      setEditingOptimizationPrompt(null);
      resetOptimizationPromptForm();
      toast({ title: "Optimization prompt updated" });
    },
    onError: () => {
      toast({ title: "Failed to update optimization prompt", variant: "destructive" });
    },
  });

  const deleteOptimizationPromptMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/optimization-prompts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/optimization-prompts"] });
      toast({ title: "Optimization prompt deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete optimization prompt", variant: "destructive" });
    },
  });

  const saveSeoMutation = useMutation({
    mutationFn: (data: SeoSettingsFormData) => 
      apiRequest("PUT", "/api/seo-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo-settings"] });
      toast({ title: "SEO settings saved" });
    },
    onError: () => {
      toast({ title: "Failed to save SEO settings", variant: "destructive" });
    },
  });

  const resetStyleForm = () => {
    setStyleForm({ name: "", tone: "professional", guidelines: "", exampleText: "" });
  };

  const resetImageStyleForm = () => {
    setImageStyleForm({ name: "", description: "", stylePrompt: "", additionalInstructions: "" });
  };

  const resetAudienceForm = () => {
    setAudienceForm({ name: "", description: "", demographics: "", painPoints: "", goals: "", tone: "" });
  };

  const resetOptimizationPromptForm = () => {
    setOptimizationPromptForm({ name: "", description: "", prompt: "", promptType: "analysis", isDefault: false });
  };

  const handleEditOptimizationPrompt = (prompt: OptimizationPrompt) => {
    setEditingOptimizationPrompt(prompt);
    setOptimizationPromptForm({
      name: prompt.name,
      description: prompt.description || "",
      prompt: prompt.prompt,
      promptType: (prompt.promptType as "analysis" | "direct") || "analysis",
      isDefault: prompt.isDefault || false,
    });
    setOptimizationPromptDialogOpen(true);
  };

  const handleSaveOptimizationPrompt = () => {
    if (editingOptimizationPrompt) {
      updateOptimizationPromptMutation.mutate({
        id: editingOptimizationPrompt.id,
        data: optimizationPromptForm,
      });
    } else {
      createOptimizationPromptMutation.mutate(optimizationPromptForm);
    }
  };

  const handleEditStyle = (style: WritingStyle) => {
    setEditingStyle(style);
    setStyleForm({
      name: style.name,
      tone: style.tone || "professional",
      guidelines: style.guidelines || "",
      exampleText: style.exampleText || "",
    });
    setStyleDialogOpen(true);
  };

  const handleSaveStyle = () => {
    if (editingStyle) {
      updateStyleMutation.mutate({ id: editingStyle.id, data: styleForm });
    } else {
      createStyleMutation.mutate(styleForm);
    }
  };

  const handleEditImageStyle = (style: ImageStyle) => {
    setEditingImageStyle(style);
    setImageStyleForm({
      name: style.name,
      description: style.description || "",
      stylePrompt: style.stylePrompt || "",
      additionalInstructions: style.additionalInstructions || "",
    });
    setImageStyleDialogOpen(true);
  };

  const handleSaveImageStyle = () => {
    if (editingImageStyle) {
      updateImageStyleMutation.mutate({ id: editingImageStyle.id, data: imageStyleForm });
    } else {
      createImageStyleMutation.mutate(imageStyleForm);
    }
  };

  const handleEditAudience = (audience: TargetAudience) => {
    setEditingAudience(audience);
    setAudienceForm({
      name: audience.name,
      description: audience.description || "",
      demographics: audience.demographics || "",
      painPoints: audience.painPoints || "",
      goals: audience.goals || "",
      tone: audience.tone || "",
    });
    setAudienceDialogOpen(true);
  };

  const handleSaveAudience = () => {
    if (editingAudience) {
      updateAudienceMutation.mutate({ id: editingAudience.id, data: audienceForm });
    } else {
      createAudienceMutation.mutate(audienceForm);
    }
  };

  const handleSaveSeo = () => {
    saveSeoMutation.mutate(seoForm);
  };

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  return (
    <div className="space-y-6 max-w-3xl" data-testid="page-settings">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, content preferences, and application settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Writing Styles</CardTitle>
          </div>
          <CardDescription>
            Define writing styles for AI-generated content to match your brand voice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stylesLoading ? (
            <div className="text-sm text-muted-foreground">Loading styles...</div>
          ) : writingStyles.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No writing styles defined yet. Create one to guide AI content generation.
            </div>
          ) : (
            <div className="space-y-2">
              {writingStyles.map((style) => (
                <div 
                  key={style.id}
                  className="flex items-center justify-between p-3 rounded-md border bg-muted/30"
                  data-testid={`style-item-${style.id}`}
                >
                  <div>
                    <div className="font-medium">{style.name}</div>
                    {style.guidelines && (
                      <div className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                        {style.guidelines}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditStyle(style)}
                      data-testid={`button-edit-style-${style.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteStyleMutation.mutate(style.id)}
                      data-testid={`button-delete-style-${style.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Dialog open={styleDialogOpen} onOpenChange={(open) => {
            setStyleDialogOpen(open);
            if (!open) {
              setEditingStyle(null);
              resetStyleForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-style">
                <Plus className="mr-2 h-4 w-4" />
                Add Writing Style
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingStyle ? "Edit" : "Add"} Writing Style</DialogTitle>
                <DialogDescription>
                  Define how AI should write content for your brand
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="style-name">Style Name</Label>
                  <Input
                    id="style-name"
                    value={styleForm.name}
                    onChange={(e) => setStyleForm({ ...styleForm, name: e.target.value })}
                    placeholder="e.g., Friendly Expert"
                    data-testid="input-style-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="style-guidelines">Writing Guidelines</Label>
                  <Textarea
                    id="style-guidelines"
                    value={styleForm.guidelines}
                    onChange={(e) => setStyleForm({ ...styleForm, guidelines: e.target.value })}
                    placeholder="Describe how content should be written..."
                    className="min-h-[100px]"
                    data-testid="input-style-guidelines"
                  />
                  {linkColumns.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground mb-1.5">Available placeholders from Internal Links:</div>
                      <div className="flex flex-wrap gap-1">
                        {linkColumns.map((col) => (
                          <Button
                            key={col.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs font-mono"
                            onClick={() => {
                              navigator.clipboard.writeText(`{{${col.name}}}`);
                              toast({ title: `Copied {{${col.name}}}` });
                            }}
                            data-testid={`placeholder-${col.id}`}
                          >
                            {`{{${col.name}}}`}
                            <Copy className="ml-1 h-3 w-3" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="style-example">Example Text (optional)</Label>
                  <Textarea
                    id="style-example"
                    value={styleForm.exampleText}
                    onChange={(e) => setStyleForm({ ...styleForm, exampleText: e.target.value })}
                    placeholder="Provide an example of the desired writing style..."
                    className="min-h-[80px]"
                    data-testid="input-style-example"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSaveStyle}
                  disabled={!styleForm.name || createStyleMutation.isPending || updateStyleMutation.isPending}
                  data-testid="button-save-style"
                >
                  {createStyleMutation.isPending || updateStyleMutation.isPending ? "Saving..." : "Save Style"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Image Styles</CardTitle>
          </div>
          <CardDescription>
            Define image generation styles for featured images and content illustrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {imageStylesLoading ? (
            <div className="text-sm text-muted-foreground">Loading styles...</div>
          ) : imageStyles.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No image styles defined yet. Create one to guide AI image generation.
            </div>
          ) : (
            <div className="space-y-2">
              {imageStyles.map((style) => (
                <div 
                  key={style.id}
                  className="flex items-center justify-between p-3 rounded-md border bg-muted/30"
                  data-testid={`image-style-item-${style.id}`}
                >
                  <div>
                    <div className="font-medium">{style.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {style.stylePrompt || "No style prompt"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditImageStyle(style)}
                      data-testid={`button-edit-image-style-${style.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteImageStyleMutation.mutate(style.id)}
                      data-testid={`button-delete-image-style-${style.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Dialog open={imageStyleDialogOpen} onOpenChange={(open) => {
            setImageStyleDialogOpen(open);
            if (!open) {
              setEditingImageStyle(null);
              resetImageStyleForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-image-style">
                <Plus className="mr-2 h-4 w-4" />
                Add Image Style
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingImageStyle ? "Edit" : "Add"} Image Style</DialogTitle>
                <DialogDescription>
                  Define how AI should generate images for your content
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="image-style-name">Style Name</Label>
                  <Input
                    id="image-style-name"
                    value={imageStyleForm.name}
                    onChange={(e) => setImageStyleForm({ ...imageStyleForm, name: e.target.value })}
                    placeholder="e.g., Mystical Featured"
                    data-testid="input-image-style-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-style-prompt">Style Prompt</Label>
                  <Textarea
                    id="image-style-prompt"
                    value={imageStyleForm.stylePrompt}
                    onChange={(e) => setImageStyleForm({ ...imageStyleForm, stylePrompt: e.target.value })}
                    placeholder="e.g., mystical, ethereal, soft lighting, purple and gold tones..."
                    className="min-h-[80px]"
                    data-testid="input-image-style-prompt"
                  />
                </div>
                                <div className="space-y-2">
                  <Label htmlFor="image-additional">Additional Instructions (optional)</Label>
                  <Textarea
                    id="image-additional"
                    value={imageStyleForm.additionalInstructions}
                    onChange={(e) => setImageStyleForm({ ...imageStyleForm, additionalInstructions: e.target.value })}
                    placeholder="Additional guidance for image generation..."
                    className="min-h-[60px]"
                    data-testid="input-image-additional"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSaveImageStyle}
                  disabled={!imageStyleForm.name || createImageStyleMutation.isPending || updateImageStyleMutation.isPending}
                  data-testid="button-save-image-style"
                >
                  {createImageStyleMutation.isPending || updateImageStyleMutation.isPending ? "Saving..." : "Save Style"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Target Audiences</CardTitle>
          </div>
          <CardDescription>
            Define target audiences to personalize content and messaging for different reader segments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {audiencesLoading ? (
            <div className="text-sm text-muted-foreground">Loading audiences...</div>
          ) : targetAudiences.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No target audiences defined yet. Create one to personalize your content.
            </div>
          ) : (
            <div className="space-y-2">
              {targetAudiences.map((audience) => (
                <div 
                  key={audience.id}
                  className="flex items-center justify-between p-3 rounded-md border bg-muted/30"
                  data-testid={`audience-item-${audience.id}`}
                >
                  <div>
                    <div className="font-medium">{audience.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                      {audience.description || audience.demographics || "No description"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditAudience(audience)}
                      data-testid={`button-edit-audience-${audience.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteAudienceMutation.mutate(audience.id)}
                      data-testid={`button-delete-audience-${audience.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Dialog open={audienceDialogOpen} onOpenChange={(open) => {
            setAudienceDialogOpen(open);
            if (!open) {
              setEditingAudience(null);
              resetAudienceForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-audience">
                <Plus className="mr-2 h-4 w-4" />
                Add Target Audience
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{editingAudience ? "Edit" : "Add"} Target Audience</DialogTitle>
                <DialogDescription>
                  Define a target audience to personalize content tone and messaging
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="audience-name">Audience Name</Label>
                  <Input
                    id="audience-name"
                    value={audienceForm.name}
                    onChange={(e) => setAudienceForm({ ...audienceForm, name: e.target.value })}
                    placeholder="e.g., Spiritual Seekers"
                    data-testid="input-audience-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience-description">Description</Label>
                  <Textarea
                    id="audience-description"
                    value={audienceForm.description}
                    onChange={(e) => setAudienceForm({ ...audienceForm, description: e.target.value })}
                    placeholder="Brief description of this audience segment..."
                    className="min-h-[60px]"
                    data-testid="input-audience-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience-demographics">Demographics</Label>
                  <Textarea
                    id="audience-demographics"
                    value={audienceForm.demographics}
                    onChange={(e) => setAudienceForm({ ...audienceForm, demographics: e.target.value })}
                    placeholder="e.g., Women 35-55, interested in spirituality and self-improvement..."
                    className="min-h-[60px]"
                    data-testid="input-audience-demographics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience-pain-points">Pain Points</Label>
                  <Textarea
                    id="audience-pain-points"
                    value={audienceForm.painPoints}
                    onChange={(e) => setAudienceForm({ ...audienceForm, painPoints: e.target.value })}
                    placeholder="What challenges or problems does this audience face?"
                    className="min-h-[60px]"
                    data-testid="input-audience-pain-points"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience-goals">Goals</Label>
                  <Textarea
                    id="audience-goals"
                    value={audienceForm.goals}
                    onChange={(e) => setAudienceForm({ ...audienceForm, goals: e.target.value })}
                    placeholder="What is this audience trying to achieve?"
                    className="min-h-[60px]"
                    data-testid="input-audience-goals"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience-tone">Preferred Tone</Label>
                  <Input
                    id="audience-tone"
                    value={audienceForm.tone}
                    onChange={(e) => setAudienceForm({ ...audienceForm, tone: e.target.value })}
                    placeholder="e.g., warm, empathetic, encouraging..."
                    data-testid="input-audience-tone"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSaveAudience}
                  disabled={!audienceForm.name || createAudienceMutation.isPending || updateAudienceMutation.isPending}
                  data-testid="button-save-audience"
                >
                  {createAudienceMutation.isPending || updateAudienceMutation.isPending ? "Saving..." : "Save Audience"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">SEO Best Practices</CardTitle>
          </div>
          <CardDescription>
            Configure guidelines for meta titles and descriptions to optimize search visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Meta Title Settings</h4>
            <div className="space-y-2">
              <Label htmlFor="title-guidelines">Title Guidelines</Label>
              <Textarea
                id="title-guidelines"
                value={seoForm.metaTitleGuidelines}
                onChange={(e) => setSeoForm({ ...seoForm, metaTitleGuidelines: e.target.value })}
                placeholder="Guidelines for writing meta titles..."
                className="min-h-[80px]"
                data-testid="input-title-guidelines"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title-length">Maximum Title Length</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="title-length"
                  type="number"
                  value={seoForm.metaTitleMaxLength}
                  onChange={(e) => setSeoForm({ ...seoForm, metaTitleMaxLength: parseInt(e.target.value) || 60 })}
                  className="w-24"
                  data-testid="input-title-length"
                />
                <span className="text-sm text-muted-foreground">characters</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Meta Description Settings</h4>
            <div className="space-y-2">
              <Label htmlFor="desc-guidelines">Description Guidelines</Label>
              <Textarea
                id="desc-guidelines"
                value={seoForm.metaDescriptionGuidelines}
                onChange={(e) => setSeoForm({ ...seoForm, metaDescriptionGuidelines: e.target.value })}
                placeholder="Guidelines for writing meta descriptions..."
                className="min-h-[80px]"
                data-testid="input-desc-guidelines"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc-length">Maximum Description Length</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="desc-length"
                  type="number"
                  value={seoForm.metaDescriptionMaxLength}
                  onChange={(e) => setSeoForm({ ...seoForm, metaDescriptionMaxLength: parseInt(e.target.value) || 160 })}
                  className="w-24"
                  data-testid="input-desc-length"
                />
                <span className="text-sm text-muted-foreground">characters</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSaveSeo}
            disabled={saveSeoMutation.isPending || seoLoading}
            data-testid="button-save-seo"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveSeoMutation.isPending ? "Saving..." : "Save SEO Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Optimization Prompts</CardTitle>
                <CardDescription>
                  Create and manage AI prompts for article optimization analysis
                </CardDescription>
              </div>
            </div>
            <Dialog open={optimizationPromptDialogOpen} onOpenChange={(open) => {
              setOptimizationPromptDialogOpen(open);
              if (!open) {
                setEditingOptimizationPrompt(null);
                resetOptimizationPromptForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-optimization-prompt">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Prompt
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingOptimizationPrompt ? "Edit" : "Create"} Optimization Prompt</DialogTitle>
                  <DialogDescription>
                    Define an AI prompt template for analyzing and optimizing articles.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="opt-prompt-name">Prompt Name</Label>
                    <Input
                      id="opt-prompt-name"
                      value={optimizationPromptForm.name}
                      onChange={(e) => setOptimizationPromptForm({ ...optimizationPromptForm, name: e.target.value })}
                      placeholder="e.g., Basic SEO Analysis, Comprehensive Review"
                      data-testid="input-optimization-prompt-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opt-prompt-description">Description (optional)</Label>
                    <Input
                      id="opt-prompt-description"
                      value={optimizationPromptForm.description}
                      onChange={(e) => setOptimizationPromptForm({ ...optimizationPromptForm, description: e.target.value })}
                      placeholder="Brief description of what this prompt does..."
                      data-testid="input-optimization-prompt-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opt-prompt-text">Prompt Template</Label>
                    <Textarea
                      id="opt-prompt-text"
                      value={optimizationPromptForm.prompt}
                      onChange={(e) => setOptimizationPromptForm({ ...optimizationPromptForm, prompt: e.target.value })}
                      placeholder="Enter your optimization prompt template..."
                      className="min-h-[300px] font-mono text-sm"
                      data-testid="input-optimization-prompt-text"
                    />
                    <p className="text-xs text-muted-foreground">
                      Available placeholders: {"{targetKeyword}"}, {"{url}"}, {"{pageTitle}"}, {"{pageMetaDescription}"}, {"{pageWordCount}"}, {"{pageHeadings}"}, {"{pageContent}"}, {"{keywords}"}, {"{competitors}"}, {"{keywordsInStrikingDistance}"}
                    </p>
                    {linkColumns.length > 0 && (
                      <div className="pt-2">
                        <div className="text-xs text-muted-foreground mb-1.5">Available placeholders from Internal Links:</div>
                        <div className="flex flex-wrap gap-1">
                          {linkColumns.map((col) => (
                            <Button
                              key={col.id}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs font-mono"
                              onClick={() => {
                                navigator.clipboard.writeText(`{{${col.name}}}`);
                                toast({ title: `Copied {{${col.name}}}` });
                              }}
                              data-testid={`opt-placeholder-${col.id}`}
                            >
                              {`{{${col.name}}}`}
                              <Copy className="ml-1 h-3 w-3" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="opt-prompt-default"
                      checked={optimizationPromptForm.isDefault}
                      onCheckedChange={(checked) => setOptimizationPromptForm({ ...optimizationPromptForm, isDefault: checked })}
                    />
                    <Label htmlFor="opt-prompt-default">Set as default prompt</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSaveOptimizationPrompt}
                    disabled={!optimizationPromptForm.name || !optimizationPromptForm.prompt || createOptimizationPromptMutation.isPending || updateOptimizationPromptMutation.isPending}
                    data-testid="button-save-optimization-prompt"
                  >
                    {createOptimizationPromptMutation.isPending || updateOptimizationPromptMutation.isPending ? "Saving..." : "Save Prompt"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {optimizationPromptsLoading ? (
            <p className="text-sm text-muted-foreground">Loading prompts...</p>
          ) : optimizationPrompts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No optimization prompts created yet. Add one to get started.</p>
          ) : (
            <div className="space-y-3">
              {optimizationPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="flex items-start justify-between p-3 border rounded-md"
                  data-testid={`optimization-prompt-${prompt.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{prompt.name}</p>
                      {prompt.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                      )}
                    </div>
                    {prompt.description && (
                      <p className="text-sm text-muted-foreground mt-1">{prompt.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 font-mono truncate">{prompt.prompt.substring(0, 100)}...</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditOptimizationPrompt(prompt)}
                      data-testid={`button-edit-optimization-prompt-${prompt.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteOptimizationPromptMutation.mutate(prompt.id)}
                      data-testid={`button-delete-optimization-prompt-${prompt.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Site Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure your website settings for tracking and analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-url">Website URL</Label>
            <Input
              id="site-url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://www.example.com"
              data-testid="input-site-url"
            />
            <p className="text-xs text-muted-foreground">
              This is used for tracking and Search Console integration
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred color scheme
              </p>
            </div>
            <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
              <SelectTrigger className="w-[140px]" data-testid="select-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how you receive updates and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive important updates via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              data-testid="switch-email-notifications"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reports">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Get a summary of your content performance
              </p>
            </div>
            <Switch
              id="weekly-reports"
              checked={weeklyReports}
              onCheckedChange={setWeeklyReports}
              data-testid="switch-weekly-reports"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="alert-threshold">Ranking Alert Threshold</Label>
            <div className="flex items-center gap-2">
              <Input
                id="alert-threshold"
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="w-24"
                data-testid="input-alert-threshold"
              />
              <span className="text-sm text-muted-foreground">
                position changes
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Alert when keyword position changes by this amount
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Security</CardTitle>
          </div>
          <CardDescription>
            Manage your API keys and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Keys</Label>
            <p className="text-sm text-muted-foreground">
              API keys are managed through Replit Secrets for security.
              Visit the Secrets tab in your Replit project to update them.
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>GSC OAuth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>GA Measurement ID</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>OpenAI (via Replit)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} data-testid="button-save-settings">
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
