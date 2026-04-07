import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  Wand2,
  Edit,
  Trash2,
  Send,
  Image as ImageIcon,
} from "lucide-react";

type SocialPost = {
  id: string;
  topicTitle: string;
  caption: string;
  status: "draft" | "scheduled" | "published" | "failed";
  platform: "instagram" | "tiktok" | "both";
  postType: "single" | "carousel";
  slides?: { imageUrl?: string }[];
  error?: string;
  createdAt: string;
  scheduledAt?: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  published: { label: "Published", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  both: "IG+TT",
};

const TABS = ["draft", "scheduled", "published"] as const;

export default function SocialPosts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("draft");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkPostType, setBulkPostType] = useState<string>("single");
  const [bulkCarouselType, setBulkCarouselType] = useState<string>("");
  const [bulkTemplateSet, setBulkTemplateSet] = useState<string>("");

  const { data: posts = [], isLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/social-posts"],
    queryFn: () => fetch("/api/social-posts").then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/social-posts/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts"] });
      toast({ title: "Post deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/social-posts/${id}/publish`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts"] });
      toast({ title: "Post published" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to publish post.", variant: "destructive" });
    },
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: () =>
      fetch("/api/social-posts/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: bulkCount,
          postType: bulkPostType,
          carouselType: bulkCarouselType || undefined,
          templateSet: bulkTemplateSet || undefined,
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts"] });
      toast({ title: "Bulk generation started", description: `Generating ${bulkCount} posts...` });
      setBulkOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start bulk generation.", variant: "destructive" });
    },
  });

  const filteredPosts = posts.filter((p) => {
    if (activeTab === "draft") return p.status === "draft" || p.status === "failed";
    return p.status === activeTab;
  });

  const counts = {
    draft: posts.filter((p) => p.status === "draft" || p.status === "failed").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
  };

  const getFirstSlideImage = (post: SocialPost): string | null => {
    if (post.slides && post.slides.length > 0 && post.slides[0].imageUrl) {
      return post.slides[0].imageUrl;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Social Posts</h1>
        <div className="flex items-center gap-3">
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Wand2 className="mr-2 h-4 w-4" />
                Bulk Generate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Generate Posts</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bulk-count">Number of Posts (1-20)</Label>
                  <Input
                    id="bulk-count"
                    type="number"
                    min={1}
                    max={20}
                    value={bulkCount}
                    onChange={(e) =>
                      setBulkCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Post Type</Label>
                  <Select value={bulkPostType} onValueChange={setBulkPostType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {bulkPostType === "carousel" && (
                  <div className="flex flex-col gap-2">
                    <Label>Carousel Type (optional)</Label>
                    <Select value={bulkCarouselType} onValueChange={setBulkCarouselType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select carousel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="storytelling">Storytelling</SelectItem>
                        <SelectItem value="listicle">Listicle</SelectItem>
                        <SelectItem value="tips">Tips</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label>Template Set (optional)</Label>
                  <Select value={bulkTemplateSet} onValueChange={setBulkTemplateSet}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="elegant">Elegant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => bulkGenerateMutation.mutate()}
                  disabled={bulkGenerateMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {bulkGenerateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate {bulkCount} Posts
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setLocation("/social-posts/create")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
            }`}
          >
            {tab}
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {counts[tab as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">No {activeTab} posts</p>
          <p className="text-sm">Create a new post or use bulk generate to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => {
            const thumbnail = getFirstSlideImage(post);
            const statusConfig = STATUS_CONFIG[post.status];
            return (
              <Card key={post.id} className="overflow-hidden">
                {/* Thumbnail */}
                <div className="relative h-40 bg-muted">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                  )}
                  {/* Badges overlay */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                      {PLATFORM_LABELS[post.platform] ?? post.platform}
                    </span>
                  </div>
                </div>

                <CardContent className="p-4 flex flex-col gap-2">
                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-tight line-clamp-1">
                    {post.topicTitle || "Untitled Post"}
                  </h3>

                  {/* Caption preview */}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.caption || "No caption"}
                  </p>

                  {/* Error message */}
                  {post.status === "failed" && post.error && (
                    <p className="text-xs text-red-500 dark:text-red-400 line-clamp-2">
                      Error: {post.error}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setLocation(`/social-posts/edit/${post.id}`)}
                    >
                      <Edit className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => publishMutation.mutate(post.id)}
                      disabled={publishMutation.isPending || post.status === "published"}
                    >
                      <Send className="mr-1 h-3.5 w-3.5" />
                      Publish
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-destructive hover:text-destructive ml-auto"
                      onClick={() => deleteMutation.mutate(post.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
