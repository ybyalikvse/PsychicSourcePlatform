import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VideoCaptionPrompt } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { DataState } from "@/components/data-state";

const PLATFORMS = ["tiktok", "instagram", "youtube", "facebook"];

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
};

const DEFAULT_CAPTION_PROMPT = "Write a compelling social media caption for this video about psychic topics. Keep it engaging, conversational, and include a call to action.";
const DEFAULT_HASHTAG_PROMPT = "Generate 10-15 relevant hashtags for this psychic/spiritual content video. Mix broad and niche tags.";

function PromptCard({ prompt, onSave, onDelete, isSaving, isDeleting }: {
  prompt: VideoCaptionPrompt;
  onSave: (id: string, captionPrompt: string, hashtagPrompt: string) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [captionPrompt, setCaptionPrompt] = useState(prompt.captionPrompt);
  const [hashtagPrompt, setHashtagPrompt] = useState(prompt.hashtagPrompt);
  const isDirty = captionPrompt !== prompt.captionPrompt || hashtagPrompt !== prompt.hashtagPrompt;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{PLATFORM_LABELS[prompt.platform] || prompt.platform}</CardTitle>
          <div className="flex items-center gap-2">
            {isDirty && <Badge variant="outline" className="text-xs">Unsaved</Badge>}
            <Button
              size="sm"
              onClick={() => onSave(prompt.id, captionPrompt, hashtagPrompt)}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(prompt.id)}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Caption Prompt</label>
          <p className="text-xs text-muted-foreground">Instructions for how to write the caption. The video topic, title, hook, and description are automatically included as context.</p>
          <Textarea
            value={captionPrompt}
            onChange={e => setCaptionPrompt(e.target.value)}
            rows={4}
            className="text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Hashtag Prompt</label>
          <p className="text-xs text-muted-foreground">Instructions for generating hashtags.</p>
          <Textarea
            value={hashtagPrompt}
            onChange={e => setHashtagPrompt(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function CaptionPrompts() {
  const { toast } = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  const { data: prompts = [], isLoading } = useQuery<VideoCaptionPrompt[]>({
    queryKey: ["/api/video-caption-prompts"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { captionPrompt: string; hashtagPrompt: string } }) => {
      const res = await apiRequest("PATCH", `/api/video-caption-prompts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-caption-prompts"] });
      toast({ title: "Prompt saved" });
      setSavingId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
      setSavingId(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { platform: string; captionPrompt: string; hashtagPrompt: string; isActive: boolean }) => {
      const res = await apiRequest("POST", "/api/video-caption-prompts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-caption-prompts"] });
      toast({ title: "Prompt created" });
      setCreating(null);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create", description: err.message, variant: "destructive" });
      setCreating(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/video-caption-prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-caption-prompts"] });
      toast({ title: "Prompt deleted" });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
      setDeletingId(null);
    },
  });

  const existingPlatforms = new Set(prompts.map(p => p.platform));
  const missingPlatforms = PLATFORMS.filter(p => !existingPlatforms.has(p));

  function handleSave(id: string, captionPrompt: string, hashtagPrompt: string) {
    setSavingId(id);
    updateMutation.mutate({ id, data: { captionPrompt, hashtagPrompt } });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this prompt? The platform will fall back to the default prompt.")) return;
    setDeletingId(id);
    deleteMutation.mutate(id);
  }

  function handleCreate(platform: string) {
    setCreating(platform);
    createMutation.mutate({
      platform,
      captionPrompt: DEFAULT_CAPTION_PROMPT,
      hashtagPrompt: DEFAULT_HASHTAG_PROMPT,
      isActive: true,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Caption Prompts</h1>
        <p className="text-muted-foreground">Customize the AI prompts used to generate captions and hashtags per platform. If no prompt is set for a platform, a generic default is used.</p>
      </div>

      {isLoading ? (
        <DataState status="loading" title="Loading" message="Fetching caption prompts..." />
      ) : (
        <div className="space-y-4">
          {prompts.length === 0 && (
            <DataState
              status="empty"
              title="No custom prompts yet"
              message="Add a platform below to customize the caption prompt for it."
            />
          )}

          {prompts.map(prompt => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onSave={handleSave}
              onDelete={handleDelete}
              isSaving={savingId === prompt.id && updateMutation.isPending}
              isDeleting={deletingId === prompt.id && deleteMutation.isPending}
            />
          ))}

          {missingPlatforms.length > 0 && (
            <>
              {prompts.length > 0 && <Separator />}
              <div>
                <p className="text-sm font-medium mb-3">Add prompt for platform:</p>
                <div className="flex flex-wrap gap-2">
                  {missingPlatforms.map(platform => (
                    <Button
                      key={platform}
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreate(platform)}
                      disabled={creating === platform && createMutation.isPending}
                    >
                      {creating === platform && createMutation.isPending
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Plus className="h-3 w-3" />}
                      {PLATFORM_LABELS[platform]}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Default fallback (used when no custom prompt exists)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Caption</p>
                <p>{DEFAULT_CAPTION_PROMPT}</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Hashtags</p>
                <p>{DEFAULT_HASHTAG_PROMPT}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
