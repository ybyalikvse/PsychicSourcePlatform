import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, Plus, Trash2, Save, X } from "lucide-react";
import type { SiteUrl } from "@shared/schema";

type SiteUrlFormData = {
  url: string;
  title: string;
  category: string;
  description: string;
};

export default function InternalLinks() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SiteUrlFormData>({ url: "", title: "", category: "", description: "" });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRow, setNewRow] = useState<SiteUrlFormData>({ url: "", title: "", category: "", description: "" });

  const { data: siteUrls = [], isLoading } = useQuery<SiteUrl[]>({
    queryKey: ["/api/site-urls"],
  });

  const createMutation = useMutation({
    mutationFn: (data: SiteUrlFormData) => apiRequest("POST", "/api/site-urls", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-urls"] });
      setIsAddingNew(false);
      setNewRow({ url: "", title: "", category: "", description: "" });
      toast({ title: "URL added" });
    },
    onError: () => {
      toast({ title: "Failed to add URL", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SiteUrlFormData> }) =>
      apiRequest("PATCH", `/api/site-urls/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-urls"] });
      setEditingId(null);
      toast({ title: "URL updated" });
    },
    onError: () => {
      toast({ title: "Failed to update URL", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/site-urls/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-urls"] });
      toast({ title: "URL deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete URL", variant: "destructive" });
    },
  });

  const startEdit = (url: SiteUrl) => {
    setEditingId(url.id);
    setEditForm({
      url: url.url,
      title: url.title,
      category: url.category || "",
      description: url.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ url: "", title: "", category: "", description: "" });
  };

  const saveEdit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: editForm });
    }
  };

  const saveNewRow = () => {
    if (newRow.url && newRow.title) {
      createMutation.mutate(newRow);
    }
  };

  const cancelNewRow = () => {
    setIsAddingNew(false);
    setNewRow({ url: "", title: "", category: "", description: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Internal Links</h1>
          <p className="text-muted-foreground">
            Manage site URLs for internal linking in generated content
          </p>
        </div>
        <Button
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew}
          data-testid="button-add-url"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add URL
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Site URLs</CardTitle>
          </div>
          <CardDescription>
            Click on any cell to edit. URLs will be used for internal linking suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted/50 border-b grid grid-cols-12 text-sm font-medium sticky top-0">
              <div className="col-span-3 px-3 py-2 border-r">Title</div>
              <div className="col-span-4 px-3 py-2 border-r">URL</div>
              <div className="col-span-2 px-3 py-2 border-r">Category</div>
              <div className="col-span-2 px-3 py-2 border-r">Description</div>
              <div className="col-span-1 px-3 py-2 text-center">Actions</div>
            </div>

            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              {isLoading ? (
                <div className="px-3 py-8 text-center text-muted-foreground">Loading...</div>
              ) : siteUrls.length === 0 && !isAddingNew ? (
                <div className="px-3 py-8 text-center text-muted-foreground">
                  No URLs added yet. Click "Add URL" to get started.
                </div>
              ) : (
                <>
                  {siteUrls.map((url) => (
                    <div
                      key={url.id}
                      className="grid grid-cols-12 border-b last:border-b-0 group"
                      data-testid={`row-url-${url.id}`}
                    >
                      {editingId === url.id ? (
                        <>
                          <div className="col-span-3 border-r">
                            <Input
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="border-0 rounded-none h-10 focus-visible:ring-1 focus-visible:ring-inset"
                              placeholder="Page title"
                              data-testid="input-edit-title"
                            />
                          </div>
                          <div className="col-span-4 border-r">
                            <Input
                              value={editForm.url}
                              onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                              className="border-0 rounded-none h-10 focus-visible:ring-1 focus-visible:ring-inset"
                              placeholder="https://..."
                              data-testid="input-edit-url"
                            />
                          </div>
                          <div className="col-span-2 border-r">
                            <Input
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="border-0 rounded-none h-10 focus-visible:ring-1 focus-visible:ring-inset"
                              placeholder="Category"
                              data-testid="input-edit-category"
                            />
                          </div>
                          <div className="col-span-2 border-r">
                            <Input
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="border-0 rounded-none h-10 focus-visible:ring-1 focus-visible:ring-inset"
                              placeholder="Description"
                              data-testid="input-edit-description"
                            />
                          </div>
                          <div className="col-span-1 flex items-center justify-center gap-1 px-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={saveEdit}
                              disabled={updateMutation.isPending}
                              className="h-8 w-8"
                              data-testid="button-save-edit"
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={cancelEdit}
                              className="h-8 w-8"
                              data-testid="button-cancel-edit"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className="col-span-3 px-3 py-2 border-r truncate cursor-pointer hover:bg-muted/30"
                            onClick={() => startEdit(url)}
                            title={url.title}
                          >
                            {url.title}
                          </div>
                          <div
                            className="col-span-4 px-3 py-2 border-r text-muted-foreground truncate cursor-pointer hover:bg-muted/30"
                            onClick={() => startEdit(url)}
                            title={url.url}
                          >
                            {url.url}
                          </div>
                          <div
                            className="col-span-2 px-3 py-2 border-r text-muted-foreground truncate cursor-pointer hover:bg-muted/30"
                            onClick={() => startEdit(url)}
                          >
                            {url.category || "-"}
                          </div>
                          <div
                            className="col-span-2 px-3 py-2 border-r text-muted-foreground truncate cursor-pointer hover:bg-muted/30"
                            onClick={() => startEdit(url)}
                            title={url.description || ""}
                          >
                            {url.description || "-"}
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(url.id)}
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid={`button-delete-${url.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {isAddingNew && (
                    <div className="grid grid-cols-12 border-b bg-muted/20" data-testid="row-new-url">
                      <div className="col-span-3 border-r">
                        <Input
                          value={newRow.title}
                          onChange={(e) => setNewRow({ ...newRow, title: e.target.value })}
                          className="border-0 rounded-none h-10 focus-visible:ring-1 focus-visible:ring-inset"
                          placeholder="Page title *"
                          autoFocus
                          data-testid="input-new-title"
                        />
                      </div>
                      <div className="col-span-4 border-r">
                        <Input
                          value={newRow.url}
                          onChange={(e) => setNewRow({ ...newRow, url: e.target.value })}
                          className="border-0 rounded-none h-10 focus-visible:ring-1 focus-visible:ring-inset"
                          placeholder="https://... *"
                          data-testid="input-new-url"
                        />
                      </div>
                      <div className="col-span-2 border-r">
                        <Input
                          value={newRow.category}
                          onChange={(e) => setNewRow({ ...newRow, category: e.target.value })}
                          className="border-0 rounded-none h-10 focus-visible:ring-1 focus-visible:ring-inset"
                          placeholder="Category"
                          data-testid="input-new-category"
                        />
                      </div>
                      <div className="col-span-2 border-r">
                        <Input
                          value={newRow.description}
                          onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                          className="border-0 rounded-none h-10 focus-visible:ring-1 focus-visible:ring-inset"
                          placeholder="Description"
                          data-testid="input-new-description"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center gap-1 px-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={saveNewRow}
                          disabled={!newRow.url || !newRow.title || createMutation.isPending}
                          className="h-8 w-8"
                          data-testid="button-save-new"
                        >
                          <Save className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={cancelNewRow}
                          className="h-8 w-8"
                          data-testid="button-cancel-new"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="px-4 py-3 text-sm text-muted-foreground border-t bg-muted/30">
            {siteUrls.length} URL{siteUrls.length !== 1 ? "s" : ""} total
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
