import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContentTable } from "@/components/content-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Trash2, Eye, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@shared/schema";

export default function Content() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteArticle, setDeleteArticle] = useState<Article | null>(null);
  const [viewArticle, setViewArticle] = useState<Article | null>(null);

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Article deleted",
        description: "The article has been permanently deleted.",
      });
      setDeleteArticle(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete article. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredArticles = articles
    .filter((article) => {
      const matchesSearch =
        !searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || article.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by most recent first (updatedAt, then createdAt)
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredArticles.map((a) => a.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleEdit = (article: Article) => {
    setLocation(`/edit/${article.id}`);
  };

  const handleView = (article: Article) => {
    setViewArticle(article);
  };

  const handleDelete = (article: Article) => {
    setDeleteArticle(article);
  };

  return (
    <div className="space-y-6" data-testid="page-content">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Content</h1>
          <p className="text-muted-foreground">
            Manage your articles and content
          </p>
        </div>
        <Button onClick={() => setLocation("/create")} data-testid="button-create-article">
          <Plus className="mr-2 h-4 w-4" />
          New Article
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-articles"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              toast({
                title: "Bulk delete",
                description: `${selectedIds.length} articles selected for deletion.`,
              });
            }}
            data-testid="button-bulk-delete"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedIds.length})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Loading articles...
        </div>
      ) : (
        <ContentTable
          articles={filteredArticles}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={!!deleteArticle} onOpenChange={() => setDeleteArticle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteArticle?.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteArticle(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteArticle && deleteMutation.mutate(deleteArticle.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewArticle} onOpenChange={() => setViewArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">{viewArticle?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2 pt-2">
              <Badge variant={viewArticle?.status === "published" ? "default" : "secondary"}>
                {viewArticle?.status}
              </Badge>
              {viewArticle?.targetKeyword && (
                <span className="text-sm">Target: {viewArticle.targetKeyword}</span>
              )}
              {viewArticle?.wordCount && (
                <span className="text-sm">{viewArticle.wordCount} words</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] pr-4">
            <div 
              className="prose prose-sm dark:prose-invert max-w-none [&_figure]:m-0 [&_figure]:p-0 [&_figure_img]:m-0 [&_figcaption]:hidden"
              dangerouslySetInnerHTML={{ __html: viewArticle?.content || "" }}
            />
          </ScrollArea>
          {(viewArticle?.metaTitle || viewArticle?.metaDescription) && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">SEO Metadata</p>
              {viewArticle.metaTitle && (
                <p className="text-sm"><strong>Title:</strong> {viewArticle.metaTitle}</p>
              )}
              {viewArticle.metaDescription && (
                <p className="text-sm"><strong>Description:</strong> {viewArticle.metaDescription}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewArticle(null)}>
              Close
            </Button>
            <Button onClick={() => { setViewArticle(null); viewArticle && handleEdit(viewArticle); }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
