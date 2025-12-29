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
import { Save, Globe, Bell, Shield, Palette, PenTool, Search, Plus, Edit2, Trash2, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WritingStyle, SeoSettings as SeoSettingsType, ImageStyle } from "@shared/schema";

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
  optimizationPrompt: string;
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

  const { data: writingStyles = [], isLoading: stylesLoading } = useQuery<WritingStyle[]>({
    queryKey: ["/api/writing-styles"],
  });

  const { data: imageStyles = [], isLoading: imageStylesLoading } = useQuery<ImageStyle[]>({
    queryKey: ["/api/image-styles"],
  });

  const { data: seoSettings, isLoading: seoLoading } = useQuery<SeoSettingsType>({
    queryKey: ["/api/seo-settings"],
  });

  const [seoForm, setSeoForm] = useState<SeoSettingsFormData>({
    metaTitleGuidelines: "",
    metaTitleMaxLength: 60,
    metaDescriptionGuidelines: "",
    metaDescriptionMaxLength: 160,
    optimizationPrompt: "",
  });

  useEffect(() => {
    if (seoSettings) {
      setSeoForm({
        metaTitleGuidelines: seoSettings.metaTitleGuidelines || "",
        metaTitleMaxLength: seoSettings.metaTitleMaxLength || 60,
        metaDescriptionGuidelines: seoSettings.metaDescriptionGuidelines || "",
        metaDescriptionMaxLength: seoSettings.metaDescriptionMaxLength || 160,
        optimizationPrompt: seoSettings.optimizationPrompt || "",
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

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Article Optimization AI Prompt</h4>
            <p className="text-xs text-muted-foreground">
              Customize the AI prompt used to generate optimization recommendations. Use placeholders like {"{targetKeyword}"}, {"{url}"}, {"{pageContent}"}, {"{keywords}"}, and {"{competitors}"} which will be replaced with actual data.
            </p>
            <div className="space-y-2">
              <Label htmlFor="optimization-prompt">Custom Optimization Prompt</Label>
              <Textarea
                id="optimization-prompt"
                value={seoForm.optimizationPrompt}
                onChange={(e) => setSeoForm({ ...seoForm, optimizationPrompt: e.target.value })}
                placeholder="Leave empty to use the default prompt. Enter a custom prompt to override..."
                className="min-h-[300px] font-mono text-sm"
                data-testid="input-optimization-prompt"
              />
              <p className="text-xs text-muted-foreground">
                Available placeholders: {"{targetKeyword}"}, {"{url}"}, {"{pageTitle}"}, {"{pageMetaDescription}"}, {"{pageWordCount}"}, {"{pageHeadings}"}, {"{pageContent}"}, {"{keywords}"}, {"{competitors}"}, {"{keywordsInStrikingDistance}"}
              </p>
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
