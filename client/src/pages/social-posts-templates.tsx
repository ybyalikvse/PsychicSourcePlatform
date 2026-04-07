import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";

interface SlideConfig {
  bg_gradient: [string, string];
  text_color: string;
  accent_color: string;
  font: string;
  font_size: number;
  text_mode: string;
}

interface SlideTemplate {
  id: number;
  templateSetId: number;
  name: string;
  type: string;
  config: SlideConfig;
  imagePromptTemplate: string | null;
}

interface TemplateSet {
  id: number;
  name: string;
  description: string | null;
  imagePromptTemplate: string | null;
  igFontScale: number;
  watermarkText: string | null;
  watermarkPosition: string;
  watermarkSize: number;
  watermarkOpacity: number;
  active: boolean;
}

const DEFAULT_TEMPLATE_SET = {
  name: "",
  description: "",
  imagePromptTemplate: "",
  igFontScale: 1.0,
  watermarkText: "",
  watermarkPosition: "bottom-right",
  watermarkSize: 16,
  watermarkOpacity: 0.5,
  active: true,
};

const DEFAULT_SLIDE_CONFIG: SlideConfig = {
  bg_gradient: ["#1a1a2e", "#16213e"],
  text_color: "#ffffff",
  accent_color: "#e94560",
  font: "Inter",
  font_size: 24,
  text_mode: "title_and_body",
};

const DEFAULT_SLIDE_TEMPLATE = {
  name: "",
  type: "content",
  config: { ...DEFAULT_SLIDE_CONFIG },
  imagePromptTemplate: "",
};

export default function SocialPostsTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [setDialogOpen, setSetDialogOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<TemplateSet | null>(null);
  const [setForm, setSetForm] = useState({ ...DEFAULT_TEMPLATE_SET });

  const [slideDialogOpen, setSlideDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SlideTemplate | null>(null);
  const [slideForm, setSlideForm] = useState({ ...DEFAULT_SLIDE_TEMPLATE });
  const [slideParentId, setSlideParentId] = useState<number | null>(null);

  const { data: templateSets = [], isLoading } = useQuery<TemplateSet[]>({
    queryKey: ["/api/social-posts/templates"],
  });

  const { data: slideTemplates = [] } = useQuery<SlideTemplate[]>({
    queryKey: ["/api/social-posts/slide-templates"],
  });

  const createSetMutation = useMutation({
    mutationFn: async (data: typeof setForm) => {
      const res = await apiRequest("POST", "/api/social-posts/templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts/templates"] });
      setSetDialogOpen(false);
      toast({ title: "Template set created" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateSetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof setForm }) => {
      const res = await apiRequest("PUT", `/api/social-posts/templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts/templates"] });
      setSetDialogOpen(false);
      toast({ title: "Template set updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteSetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/social-posts/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts/templates"] });
      toast({ title: "Template set deleted" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createSlideMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/social-posts/slide-templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts/slide-templates"] });
      setSlideDialogOpen(false);
      toast({ title: "Slide template created" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateSlideMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PUT", `/api/social-posts/slide-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts/slide-templates"] });
      setSlideDialogOpen(false);
      toast({ title: "Slide template updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteSlideMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/social-posts/slide-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts/slide-templates"] });
      toast({ title: "Slide template deleted" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openCreateSet() {
    setEditingSet(null);
    setSetForm({ ...DEFAULT_TEMPLATE_SET });
    setSetDialogOpen(true);
  }

  function openEditSet(ts: TemplateSet) {
    setEditingSet(ts);
    setSetForm({
      name: ts.name,
      description: ts.description || "",
      imagePromptTemplate: ts.imagePromptTemplate || "",
      igFontScale: ts.igFontScale,
      watermarkText: ts.watermarkText || "",
      watermarkPosition: ts.watermarkPosition,
      watermarkSize: ts.watermarkSize,
      watermarkOpacity: ts.watermarkOpacity,
      active: ts.active,
    });
    setSetDialogOpen(true);
  }

  function handleSetSubmit() {
    if (editingSet) {
      updateSetMutation.mutate({ id: editingSet.id, data: setForm });
    } else {
      createSetMutation.mutate(setForm);
    }
  }

  function openCreateSlide(parentId: number) {
    setSlideParentId(parentId);
    setEditingSlide(null);
    setSlideForm({ ...DEFAULT_SLIDE_TEMPLATE, config: { ...DEFAULT_SLIDE_CONFIG } });
    setSlideDialogOpen(true);
  }

  function openEditSlide(slide: SlideTemplate) {
    setSlideParentId(slide.templateSetId);
    setEditingSlide(slide);
    setSlideForm({
      name: slide.name,
      type: slide.type,
      config: { ...DEFAULT_SLIDE_CONFIG, ...slide.config },
      imagePromptTemplate: slide.imagePromptTemplate || "",
    });
    setSlideDialogOpen(true);
  }

  function handleSlideSubmit() {
    const payload = {
      ...slideForm,
      templateSetId: slideParentId,
    };
    if (editingSlide) {
      updateSlideMutation.mutate({ id: editingSlide.id, data: payload });
    } else {
      createSlideMutation.mutate(payload);
    }
  }

  const isSaving = createSetMutation.isPending || updateSetMutation.isPending;
  const isSlideSaving = createSlideMutation.isPending || updateSlideMutation.isPending;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Template Sets</h1>
        <Button onClick={openCreateSet}>
          <Plus className="mr-2 h-4 w-4" /> Create Template Set
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templateSets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No template sets yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {templateSets.map((ts) => {
            const slides = slideTemplates.filter((s) => s.templateSetId === ts.id);
            return (
              <Card key={ts.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{ts.name}</CardTitle>
                      {ts.description && (
                        <p className="text-sm text-muted-foreground">{ts.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {ts.active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditSet(ts)}>
                      <Edit className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSetMutation.mutate(ts.id)}
                      disabled={deleteSetMutation.isPending}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Slide Templates</h4>
                      <Button variant="ghost" size="sm" onClick={() => openCreateSlide(ts.id)}>
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </div>
                    {slides.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No slide templates yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {slides.map((slide) => (
                          <div
                            key={slide.id}
                            className="flex items-center justify-between rounded-md border p-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {slide.type}
                              </Badge>
                              <span>{slide.name}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => openEditSlide(slide)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => deleteSlideMutation.mutate(slide.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Template Set Dialog */}
      <Dialog open={setDialogOpen} onOpenChange={setSetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSet ? "Edit Template Set" : "Create Template Set"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="set-name">Name</Label>
              <Input
                id="set-name"
                value={setForm.name}
                onChange={(e) => setSetForm({ ...setForm, name: e.target.value })}
                placeholder="Template set name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="set-desc">Description</Label>
              <Textarea
                id="set-desc"
                value={setForm.description}
                onChange={(e) => setSetForm({ ...setForm, description: e.target.value })}
                placeholder="Brief description"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="set-prompt">Image Prompt Template</Label>
              <Textarea
                id="set-prompt"
                value={setForm.imagePromptTemplate}
                onChange={(e) => setSetForm({ ...setForm, imagePromptTemplate: e.target.value })}
                placeholder="Enter image prompt template..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Available placeholders: {"{topic}"}, {"{slide_text}"}, {"{title}"}, {"{slide_number}"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="set-font-scale">IG Font Scale</Label>
                <Input
                  id="set-font-scale"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={setForm.igFontScale}
                  onChange={(e) => setSetForm({ ...setForm, igFontScale: parseFloat(e.target.value) || 1.0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-watermark-text">Watermark Text</Label>
                <Input
                  id="set-watermark-text"
                  value={setForm.watermarkText}
                  onChange={(e) => setSetForm({ ...setForm, watermarkText: e.target.value })}
                  placeholder="e.g. @mybrand"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Watermark Position</Label>
                <Select
                  value={setForm.watermarkPosition}
                  onValueChange={(val) => setSetForm({ ...setForm, watermarkPosition: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-wm-size">Watermark Size</Label>
                <Input
                  id="set-wm-size"
                  type="number"
                  min="1"
                  value={setForm.watermarkSize}
                  onChange={(e) => setSetForm({ ...setForm, watermarkSize: parseInt(e.target.value) || 16 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-wm-opacity">Watermark Opacity</Label>
                <Input
                  id="set-wm-opacity"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={setForm.watermarkOpacity}
                  onChange={(e) => setSetForm({ ...setForm, watermarkOpacity: parseFloat(e.target.value) || 0.5 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="set-active"
                checked={setForm.active}
                onCheckedChange={(checked) => setSetForm({ ...setForm, active: !!checked })}
              />
              <Label htmlFor="set-active">Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSetDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetSubmit} disabled={isSaving || !setForm.name.trim()}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSet ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Slide Template Dialog */}
      <Dialog open={slideDialogOpen} onOpenChange={setSlideDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlide ? "Edit Slide Template" : "Add Slide Template"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slide-name">Name</Label>
                <Input
                  id="slide-name"
                  value={slideForm.name}
                  onChange={(e) => setSlideForm({ ...slideForm, name: e.target.value })}
                  placeholder="Slide template name"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={slideForm.type}
                  onValueChange={(val) => setSlideForm({ ...slideForm, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="cta">CTA</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Background Gradient</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={slideForm.config.bg_gradient[0]}
                    onChange={(e) =>
                      setSlideForm({
                        ...slideForm,
                        config: {
                          ...slideForm.config,
                          bg_gradient: [e.target.value, slideForm.config.bg_gradient[1]],
                        },
                      })
                    }
                    className="w-16 h-9 p-1"
                  />
                  <Input
                    type="color"
                    value={slideForm.config.bg_gradient[1]}
                    onChange={(e) =>
                      setSlideForm({
                        ...slideForm,
                        config: {
                          ...slideForm.config,
                          bg_gradient: [slideForm.config.bg_gradient[0], e.target.value],
                        },
                      })
                    }
                    className="w-16 h-9 p-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={slideForm.config.text_color}
                    onChange={(e) =>
                      setSlideForm({
                        ...slideForm,
                        config: { ...slideForm.config, text_color: e.target.value },
                      })
                    }
                    className="w-full h-9 p-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <Input
                    type="color"
                    value={slideForm.config.accent_color}
                    onChange={(e) =>
                      setSlideForm({
                        ...slideForm,
                        config: { ...slideForm.config, accent_color: e.target.value },
                      })
                    }
                    className="w-full h-9 p-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="slide-font">Font</Label>
                  <Input
                    id="slide-font"
                    value={slideForm.config.font}
                    onChange={(e) =>
                      setSlideForm({
                        ...slideForm,
                        config: { ...slideForm.config, font: e.target.value },
                      })
                    }
                    placeholder="Font family"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slide-font-size">Font Size</Label>
                  <Input
                    id="slide-font-size"
                    type="number"
                    min="8"
                    value={slideForm.config.font_size}
                    onChange={(e) =>
                      setSlideForm({
                        ...slideForm,
                        config: { ...slideForm.config, font_size: parseInt(e.target.value) || 24 },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Text Mode</Label>
                <Select
                  value={slideForm.config.text_mode}
                  onValueChange={(val) =>
                    setSlideForm({
                      ...slideForm,
                      config: { ...slideForm.config, text_mode: val },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title_and_body">Title & Body</SelectItem>
                    <SelectItem value="title_only">Title Only</SelectItem>
                    <SelectItem value="body_only">Body Only</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slide-prompt">Image Prompt Template</Label>
                <Textarea
                  id="slide-prompt"
                  value={slideForm.imagePromptTemplate}
                  onChange={(e) => setSlideForm({ ...slideForm, imagePromptTemplate: e.target.value })}
                  placeholder="Override image prompt for this slide type..."
                  rows={3}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div
                className="rounded-lg border overflow-hidden aspect-square flex flex-col items-center justify-center p-6"
                style={{
                  background: `linear-gradient(135deg, ${slideForm.config.bg_gradient[0]}, ${slideForm.config.bg_gradient[1]})`,
                  color: slideForm.config.text_color,
                  fontFamily: slideForm.config.font,
                }}
              >
                {(slideForm.config.text_mode === "title_and_body" ||
                  slideForm.config.text_mode === "title_only") && (
                  <h3
                    className="font-bold text-center mb-2"
                    style={{
                      fontSize: `${slideForm.config.font_size}px`,
                      color: slideForm.config.accent_color,
                    }}
                  >
                    Sample Title
                  </h3>
                )}
                {(slideForm.config.text_mode === "title_and_body" ||
                  slideForm.config.text_mode === "body_only") && (
                  <p
                    className="text-center opacity-90"
                    style={{ fontSize: `${Math.max(12, slideForm.config.font_size - 6)}px` }}
                  >
                    This is sample body text to preview how content will appear on the slide.
                  </p>
                )}
                {slideForm.config.text_mode === "none" && (
                  <p className="text-sm opacity-50">(Image only - no text overlay)</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSlideDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSlideSubmit} disabled={isSlideSaving || !slideForm.name.trim()}>
              {isSlideSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSlide ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
