import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Save, Loader2, MessageSquare, SlidersHorizontal, List, Settings, Plus, Edit2, Trash2,
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { VideoCaptionPrompt } from "@shared/schema";

interface CiSetting {
  id: number;
  key: string;
  value: string;
  updatedAt: string;
}

const PROMPT_KEYS = [
  { key: "analysis_system_prompt", label: "Analysis System Prompt", description: "System prompt used when analyzing competitor videos" },
  { key: "analysis_user_prompt", label: "Analysis User Prompt", description: "User prompt template for video analysis" },
  { key: "brief_system_prompt", label: "Brief System Prompt", description: "System prompt for generating weekly briefs" },
  { key: "brief_user_prompt", label: "Brief User Prompt", description: "User prompt template for brief generation" },
  { key: "script_system_prompt", label: "Script System Prompt", description: "System prompt for script generation" },
  { key: "script_user_prompt", label: "Script User Prompt", description: "User prompt template for script generation" },
  { key: "performance_system_prompt", label: "Performance System Prompt", description: "System prompt for performance analysis" },
  { key: "performance_user_prompt", label: "Performance User Prompt", description: "User prompt template for performance analysis" },
];

const THRESHOLD_KEYS = [
  { key: "scrape_min_views", label: "Minimum Views for Scraping", description: "Only scrape videos with at least this many views" },
  { key: "scrape_max_age_days", label: "Max Age (Days)", description: "Only scrape videos published within this many days" },
];

const TOPIC_LIST_KEYS = [
  { key: "blocked_topics", label: "Blocked Topics", description: "Topics to exclude from analysis (one per line)" },
  { key: "topic_categories", label: "Topic Categories", description: "Valid topic categories for classification (one per line)" },
  { key: "hook_types", label: "Hook Types", description: "Valid hook types for classification (one per line)" },
];

const GENERAL_KEYS = [
  { key: "ai_model", label: "AI Model", description: "The AI model to use for analysis and generation (e.g., anthropic/claude-sonnet-4-5)" },
  { key: "own_tiktok_handles", label: "Own TikTok Handles", description: "Comma-separated list of your own TikTok handles (used for performance tracking)" },
  { key: "brief_count", label: "Briefs Per Run", description: "Number of content briefs to generate per pipeline run (e.g. 5, 10)" },
  { key: "show_pay_amount", label: "Show Pay Amount", description: "Show or hide the pay amount field on video requests. Set to 'true' to show, 'false' to hide." },
  { key: "claim_deadline_days", label: "Claim Deadline (Days)", description: "Auto-set the required date to this many days after a psychic claims a request." },
];

export default function CiSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("prompts");
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [seeded, setSeeded] = useState(false);

  const { data: settings = [], isLoading } = useQuery<CiSetting[]>({
    queryKey: ["/api/ci/settings"],
  });

  // Caption prompts
  const [captionPromptDialogOpen, setCaptionPromptDialogOpen] = useState(false);
  const [editingCaptionPrompt, setEditingCaptionPrompt] = useState<VideoCaptionPrompt | null>(null);
  const [captionPromptForm, setCaptionPromptForm] = useState({ platform: "tiktok", captionPrompt: "", hashtagPrompt: "", isActive: true });

  const { data: captionPrompts = [], isLoading: captionPromptsLoading } = useQuery<VideoCaptionPrompt[]>({
    queryKey: ["/api/video-caption-prompts"],
  });

  const createCaptionPromptMutation = useMutation({
    mutationFn: (data: typeof captionPromptForm) => apiRequest("POST", "/api/video-caption-prompts", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/video-caption-prompts"] }); setCaptionPromptDialogOpen(false); toast({ title: "Caption prompt created" }); },
    onError: (e: Error) => toast({ title: "Failed to create", description: e.message, variant: "destructive" }),
  });

  const updateCaptionPromptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof captionPromptForm> }) => apiRequest("PATCH", `/api/video-caption-prompts/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/video-caption-prompts"] }); setCaptionPromptDialogOpen(false); toast({ title: "Caption prompt updated" }); },
    onError: (e: Error) => toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
  });

  const deleteCaptionPromptMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/video-caption-prompts/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/video-caption-prompts"] }); toast({ title: "Caption prompt deleted" }); },
  });

  function resetCaptionPromptForm() { setCaptionPromptForm({ platform: "tiktok", captionPrompt: "", hashtagPrompt: "", isActive: true }); }

  function handleEditCaptionPrompt(p: VideoCaptionPrompt) {
    setEditingCaptionPrompt(p);
    setCaptionPromptForm({ platform: p.platform, captionPrompt: p.captionPrompt, hashtagPrompt: p.hashtagPrompt, isActive: p.isActive ?? true });
    setCaptionPromptDialogOpen(true);
  }

  function handleSaveCaptionPrompt() {
    if (editingCaptionPrompt) {
      updateCaptionPromptMutation.mutate({ id: editingCaptionPrompt.id, data: captionPromptForm });
    } else {
      createCaptionPromptMutation.mutate(captionPromptForm);
    }
  }

  // Seed defaults only if no settings exist
  const seedMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/ci/settings/seed");
    },
    onSuccess: () => {
      setSeeded(true);
      queryClient.invalidateQueries({ queryKey: ["/api/ci/settings"] });
    },
  });

  useEffect(() => {
    if (!isLoading && settings.length === 0 && !seeded) {
      seedMutation.mutate();
    }
  }, [isLoading, settings.length]);

  // Sync fetched settings into local state
  useEffect(() => {
    if (settings.length > 0) {
      const values: Record<string, string> = {};
      settings.forEach((s) => {
        values[s.key] = s.value;
      });
      setLocalValues((prev) => {
        // Only set values that haven't been locally edited
        const next = { ...prev };
        settings.forEach((s) => {
          if (!(s.key in next)) {
            next[s.key] = s.value;
          }
        });
        return next;
      });
    }
  }, [settings]);

  // Initialize local values from settings on first load
  useEffect(() => {
    if (settings.length > 0 && Object.keys(localValues).length === 0) {
      const values: Record<string, string> = {};
      settings.forEach((s) => {
        values[s.key] = s.value;
      });
      setLocalValues(values);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("PUT", `/api/ci/settings/${key}`, { value });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ci/settings"] });
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(variables.key);
        return next;
      });
      toast({ title: "Setting saved", description: `"${variables.key}" has been updated.` });
    },
    onError: (err: Error, variables) => {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(variables.key);
        return next;
      });
      toast({ title: "Failed to save setting", description: err.message, variant: "destructive" });
    },
  });

  function getLocalValue(key: string): string {
    return localValues[key] ?? "";
  }

  function setLocalValue(key: string, value: string) {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(key: string) {
    setSavingKeys((prev) => new Set(prev).add(key));
    saveMutation.mutate({ key, value: getLocalValue(key) });
  }

  // For topic list fields: convert JSON array to one-per-line for display
  function jsonArrayToLines(value: string): string {
    try {
      const arr = JSON.parse(value);
      if (Array.isArray(arr)) return arr.join("\n");
    } catch {
      // Not valid JSON, return as-is
    }
    return value;
  }

  // For topic list fields: convert one-per-line to JSON array for saving
  function linesToJsonArray(text: string): string {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return JSON.stringify(lines);
  }

  // Track raw display text for topic lists so Enter key works
  const [topicListText, setTopicListText] = useState<Record<string, string>>({});

  function getTopicListDisplay(key: string): string {
    if (topicListText[key] !== undefined) return topicListText[key];
    return jsonArrayToLines(getLocalValue(key));
  }

  function setTopicListDisplay(key: string, displayValue: string) {
    // Store raw text — don't convert to JSON until save
    setTopicListText(prev => ({ ...prev, [key]: displayValue }));
    // Still update local values for change detection
    setLocalValue(key, linesToJsonArray(displayValue));
  }

  function handleSaveTopicList(key: string) {
    // Ensure the value is a valid JSON array before saving
    const currentVal = getLocalValue(key);
    let toSave = currentVal;
    try {
      JSON.parse(currentVal);
    } catch {
      // If it's not valid JSON, treat it as line-separated and convert
      toSave = linesToJsonArray(currentVal);
      setLocalValue(key, toSave);
    }
    setSavingKeys((prev) => new Set(prev).add(key));
    saveMutation.mutate({ key, value: toSave });
  }

  function hasChanged(key: string): boolean {
    const original = settings.find((s) => s.key === key);
    if (!original) return getLocalValue(key) !== "";
    return original.value !== getLocalValue(key);
  }

  if (isLoading && !seeded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/ci">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CI Settings</h1>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ci">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CI Settings</h1>
          <p className="text-muted-foreground">
            Configure prompts, thresholds, and topic lists for the content intelligence pipeline
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Thresholds
          </TabsTrigger>
          <TabsTrigger value="topic-lists" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Topic Lists
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="captions" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Captions
          </TabsTrigger>
        </TabsList>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          {PROMPT_KEYS.map((prompt) => (
            <Card key={prompt.key}>
              <CardHeader>
                <CardTitle className="text-base">{prompt.label}</CardTitle>
                <CardDescription>{prompt.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={getLocalValue(prompt.key)}
                  onChange={(e) => setLocalValue(prompt.key, e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder={`Enter ${prompt.label.toLowerCase()}...`}
                />
                <div className="flex items-center justify-between">
                  {hasChanged(prompt.key) && (
                    <span className="text-xs text-amber-600">Unsaved changes</span>
                  )}
                  <div className="ml-auto">
                    <Button
                      size="sm"
                      onClick={() => handleSave(prompt.key)}
                      disabled={savingKeys.has(prompt.key)}
                    >
                      {savingKeys.has(prompt.key) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Thresholds Tab */}
        <TabsContent value="thresholds" className="space-y-4">
          {THRESHOLD_KEYS.map((threshold) => (
            <Card key={threshold.key}>
              <CardHeader>
                <CardTitle className="text-base">{threshold.label}</CardTitle>
                <CardDescription>{threshold.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="number"
                  value={getLocalValue(threshold.key)}
                  onChange={(e) => setLocalValue(threshold.key, e.target.value)}
                  placeholder="Enter value..."
                  className="max-w-xs"
                />
                <div className="flex items-center justify-between">
                  {hasChanged(threshold.key) && (
                    <span className="text-xs text-amber-600">Unsaved changes</span>
                  )}
                  <div className="ml-auto">
                    <Button
                      size="sm"
                      onClick={() => handleSave(threshold.key)}
                      disabled={savingKeys.has(threshold.key)}
                    >
                      {savingKeys.has(threshold.key) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Topic Lists Tab */}
        <TabsContent value="topic-lists" className="space-y-4">
          {TOPIC_LIST_KEYS.map((topicList) => (
            <Card key={topicList.key}>
              <CardHeader>
                <CardTitle className="text-base">{topicList.label}</CardTitle>
                <CardDescription>{topicList.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={getTopicListDisplay(topicList.key)}
                  onChange={(e) => setTopicListDisplay(topicList.key, e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder={`Enter items, one per line...`}
                />
                <div className="flex items-center justify-between">
                  {hasChanged(topicList.key) && (
                    <span className="text-xs text-amber-600">Unsaved changes</span>
                  )}
                  <div className="ml-auto">
                    <Button
                      size="sm"
                      onClick={() => handleSaveTopicList(topicList.key)}
                      disabled={savingKeys.has(topicList.key)}
                    >
                      {savingKeys.has(topicList.key) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          {GENERAL_KEYS.map((general) => (
            <Card key={general.key}>
              <CardHeader>
                <CardTitle className="text-base">{general.label}</CardTitle>
                <CardDescription>{general.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={getLocalValue(general.key)}
                  onChange={(e) => setLocalValue(general.key, e.target.value)}
                  placeholder={`Enter ${general.label.toLowerCase()}...`}
                  className="max-w-lg"
                />
                <div className="flex items-center justify-between">
                  {hasChanged(general.key) && (
                    <span className="text-xs text-amber-600">Unsaved changes</span>
                  )}
                  <div className="ml-auto">
                    <Button
                      size="sm"
                      onClick={() => handleSave(general.key)}
                      disabled={savingKeys.has(general.key)}
                    >
                      {savingKeys.has(general.key) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Caption Prompts Tab */}
        <TabsContent value="captions" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Configure AI prompts for generating captions and hashtags per platform when a video is approved.</p>
            <Button size="sm" onClick={() => { setEditingCaptionPrompt(null); resetCaptionPromptForm(); setCaptionPromptDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Prompt
            </Button>
          </div>
          {captionPromptsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : captionPrompts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No caption prompts configured. Add prompts for TikTok and Instagram to customize AI-generated captions.</p>
          ) : (
            <div className="space-y-3">
              {captionPrompts.map((prompt) => (
                <Card key={prompt.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{prompt.platform}</Badge>
                          <Badge variant={prompt.isActive ? "default" : "secondary"}>{prompt.isActive ? "Active" : "Inactive"}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{prompt.captionPrompt}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleEditCaptionPrompt(prompt)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteCaptionPromptMutation.mutate(prompt.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={captionPromptDialogOpen} onOpenChange={setCaptionPromptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCaptionPrompt ? "Edit Caption Prompt" : "Add Caption Prompt"}</DialogTitle>
            <DialogDescription>Configure the AI prompt for generating video captions and hashtags for this platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Platform</Label>
              <Select value={captionPromptForm.platform} onValueChange={v => setCaptionPromptForm({ ...captionPromptForm, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Caption Prompt</Label>
              <Textarea value={captionPromptForm.captionPrompt} onChange={e => setCaptionPromptForm({ ...captionPromptForm, captionPrompt: e.target.value })} placeholder="Instructions for writing the caption..." rows={4} />
            </div>
            <div className="space-y-1">
              <Label>Hashtag Prompt</Label>
              <Textarea value={captionPromptForm.hashtagPrompt} onChange={e => setCaptionPromptForm({ ...captionPromptForm, hashtagPrompt: e.target.value })} placeholder="Instructions for generating hashtags..." rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={captionPromptForm.isActive} onCheckedChange={v => setCaptionPromptForm({ ...captionPromptForm, isActive: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCaptionPromptDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCaptionPrompt} disabled={createCaptionPromptMutation.isPending || updateCaptionPromptMutation.isPending}>
              {(createCaptionPromptMutation.isPending || updateCaptionPromptMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
