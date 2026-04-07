import { useState, useRef } from "react";
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";

interface CarouselType {
  id: number;
  name: string;
  emoji: string;
  description: string | null;
  topicPrompt: string | null;
  contentPrompt: string | null;
  captionPrompt: string | null;
  active: boolean;
  sortOrder: number;
}

const DEFAULT_FORM = {
  name: "",
  emoji: "",
  description: "",
  topicPrompt: "",
  contentPrompt: "",
  captionPrompt: "",
  active: true,
  sortOrder: 0,
};

const TOPIC_PLACEHOLDERS = ["{carousel_name}", "{carousel_description}"];
const CONTENT_PLACEHOLDERS = ["{topic}", "{slide_count}", "{carousel_name}", "{carousel_description}"];
const CAPTION_PLACEHOLDERS = ["{topic}", "{caption}", "{hashtags}", "{carousel_name}"];

export default function SocialPostsCarouselTypes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CarouselType | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const focusedFieldRef = useRef<string | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const { data: carouselTypes = [], isLoading } = useQuery<CarouselType[]>({
    queryKey: ["/api/social-posts/carousel-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/social-posts/carousel-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts/carousel-types"] });
      setDialogOpen(false);
      toast({ title: "Carousel type created" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof form }) => {
      const res = await apiRequest("PUT", `/api/social-posts/carousel-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts/carousel-types"] });
      setDialogOpen(false);
      toast({ title: "Carousel type updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/social-posts/carousel-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts/carousel-types"] });
      toast({ title: "Carousel type deleted" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...DEFAULT_FORM });
    setDialogOpen(true);
  }

  function openEdit(ct: CarouselType) {
    setEditing(ct);
    setForm({
      name: ct.name,
      emoji: ct.emoji,
      description: ct.description || "",
      topicPrompt: ct.topicPrompt || "",
      contentPrompt: ct.contentPrompt || "",
      captionPrompt: ct.captionPrompt || "",
      active: ct.active,
      sortOrder: ct.sortOrder,
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  function insertPlaceholder(field: "topicPrompt" | "contentPrompt" | "captionPrompt", placeholder: string) {
    const textarea = textareaRefs.current[field];
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = form[field];
      const newValue = currentValue.substring(0, start) + placeholder + currentValue.substring(end);
      setForm({ ...form, [field]: newValue });
      // Restore cursor position after the inserted placeholder
      requestAnimationFrame(() => {
        textarea.focus();
        const newPos = start + placeholder.length;
        textarea.setSelectionRange(newPos, newPos);
      });
    } else {
      // If no textarea focused, just append
      setForm({ ...form, [field]: form[field] + placeholder });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const sorted = [...carouselTypes].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Carousel Types</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create Type
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No carousel types yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((ct) => (
            <Card key={ct.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ct.emoji}</span>
                    <CardTitle className="text-lg">{ct.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {ct.active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    <Badge variant="outline">#{ct.sortOrder}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ct.description && (
                  <p className="text-sm text-muted-foreground">{ct.description}</p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(ct)}>
                    <Edit className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(ct.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Carousel Type" : "Create Carousel Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_100px] gap-4">
              <div className="space-y-2">
                <Label htmlFor="ct-name">Name</Label>
                <Input
                  id="ct-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Carousel type name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ct-emoji">Emoji</Label>
                <Input
                  id="ct-emoji"
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  placeholder="e.g. 🔮"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ct-desc">Description</Label>
              <Textarea
                id="ct-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of this carousel type"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ct-topic">Topic Prompt</Label>
              <Textarea
                id="ct-topic"
                ref={(el) => { textareaRefs.current["topicPrompt"] = el; }}
                value={form.topicPrompt}
                onChange={(e) => setForm({ ...form, topicPrompt: e.target.value })}
                onFocus={() => { focusedFieldRef.current = "topicPrompt"; }}
                placeholder="Prompt template for generating topics..."
                rows={3}
              />
              <div className="flex flex-wrap gap-1">
                {TOPIC_PLACEHOLDERS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => insertPlaceholder("topicPrompt", p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ct-content">Content Prompt</Label>
              <Textarea
                id="ct-content"
                ref={(el) => { textareaRefs.current["contentPrompt"] = el; }}
                value={form.contentPrompt}
                onChange={(e) => setForm({ ...form, contentPrompt: e.target.value })}
                onFocus={() => { focusedFieldRef.current = "contentPrompt"; }}
                placeholder="Prompt template for generating slide content..."
                rows={3}
              />
              <div className="flex flex-wrap gap-1">
                {CONTENT_PLACEHOLDERS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => insertPlaceholder("contentPrompt", p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ct-caption">Caption Prompt</Label>
              <Textarea
                id="ct-caption"
                ref={(el) => { textareaRefs.current["captionPrompt"] = el; }}
                value={form.captionPrompt}
                onChange={(e) => setForm({ ...form, captionPrompt: e.target.value })}
                onFocus={() => { focusedFieldRef.current = "captionPrompt"; }}
                placeholder="Prompt template for generating captions..."
                rows={3}
              />
              <div className="flex flex-wrap gap-1">
                {CAPTION_PLACEHOLDERS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => insertPlaceholder("captionPrompt", p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ct-active"
                  checked={form.active}
                  onCheckedChange={(checked) => setForm({ ...form, active: !!checked })}
                />
                <Label htmlFor="ct-active">Active</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ct-sort">Sort Order</Label>
                <Input
                  id="ct-sort"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving || !form.name.trim()}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
