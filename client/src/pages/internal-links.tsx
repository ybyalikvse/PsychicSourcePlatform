import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, Plus, Trash2, Save, X, ClipboardPaste, Upload } from "lucide-react";
import type { SiteUrl } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [bulkPasteOpen, setBulkPasteOpen] = useState(false);
  const [bulkData, setBulkData] = useState("");
  const [isPasting, setIsPasting] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const { data: siteUrls = [], isLoading } = useQuery<SiteUrl[]>({
    queryKey: ["/api/site-urls"],
  });

  const createMutation = useMutation({
    mutationFn: (data: SiteUrlFormData) => apiRequest("POST", "/api/site-urls", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-urls"] });
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

  const parseClipboardData = (text: string): SiteUrlFormData[] => {
    const rows: SiteUrlFormData[] = [];
    const lines = text.trim().split(/\r?\n/);
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const cells = line.split('\t');
      
      if (cells.length >= 2) {
        rows.push({
          title: cells[0]?.trim() || "",
          url: cells[1]?.trim() || "",
          category: cells[2]?.trim() || "",
          description: cells[3]?.trim() || "",
        });
      } else if (cells.length === 1) {
        const value = cells[0].trim();
        if (value.startsWith('http')) {
          rows.push({ title: "", url: value, category: "", description: "" });
        } else {
          rows.push({ title: value, url: "", category: "", description: "" });
        }
      }
    }
    
    return rows.filter(r => r.url || r.title);
  };

  const handleBulkImport = async () => {
    const rows = parseClipboardData(bulkData);
    
    if (rows.length === 0) {
      toast({ title: "No valid data found", variant: "destructive" });
      return;
    }

    const validRows = rows.filter(r => r.url && r.title);
    if (validRows.length === 0) {
      toast({ 
        title: "Each row needs both Title and URL", 
        description: "Format: Title [tab] URL [tab] Category [tab] Description",
        variant: "destructive" 
      });
      return;
    }

    setIsPasting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      try {
        await apiRequest("POST", "/api/site-urls", row);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ["/api/site-urls"] });
    setIsPasting(false);
    setBulkPasteOpen(false);
    setBulkData("");

    if (errorCount === 0) {
      toast({ title: `Added ${successCount} URL${successCount !== 1 ? 's' : ''}` });
    } else {
      toast({ 
        title: `Added ${successCount}, failed ${errorCount}`,
        variant: errorCount > successCount ? "destructive" : "default"
      });
    }
  };

  const handleGlobalPaste = useCallback(async (e: ClipboardEvent) => {
    if (editingId) return;
    
    const activeElement = document.activeElement;
    if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    const text = e.clipboardData?.getData('text');
    if (!text) return;

    const rows = parseClipboardData(text);
    if (rows.length === 0) return;

    if (rows.length === 1) {
      if (rows[0].url && rows[0].title) {
        e.preventDefault();
        try {
          await apiRequest("POST", "/api/site-urls", rows[0]);
          queryClient.invalidateQueries({ queryKey: ["/api/site-urls"] });
          toast({ title: "URL added" });
        } catch {
          toast({ title: "Failed to add URL", variant: "destructive" });
        }
      }
      return;
    }

    e.preventDefault();
    setBulkData(text);
    setBulkPasteOpen(true);
  }, [editingId, toast]);

  useEffect(() => {
    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [handleGlobalPaste]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editingId) {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const previewRows = parseClipboardData(bulkData);
  const validPreviewRows = previewRows.filter(r => r.url && r.title);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Internal Links</h1>
          <p className="text-muted-foreground">
            Manage site URLs for internal linking. Paste from spreadsheets supported.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bulkPasteOpen} onOpenChange={setBulkPasteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-bulk-paste">
                <ClipboardPaste className="mr-2 h-4 w-4" />
                Paste Multiple
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Bulk Import URLs</DialogTitle>
                <DialogDescription>
                  Paste data from a spreadsheet. Expected columns: Title, URL, Category (optional), Description (optional)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  placeholder={"Title\tURL\tCategory\tDescription\nPsychic Reading Guide\thttps://example.com/guide\tGuides\tComprehensive guide..."}
                  className="min-h-[150px] font-mono text-sm"
                  data-testid="textarea-bulk-paste"
                />
                
                {previewRows.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 text-sm font-medium border-b">
                      Preview ({validPreviewRows.length} valid of {previewRows.length} rows)
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="px-3 py-1.5 text-left font-medium">Title</th>
                            <th className="px-3 py-1.5 text-left font-medium">URL</th>
                            <th className="px-3 py-1.5 text-left font-medium">Category</th>
                            <th className="px-3 py-1.5 text-left font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {previewRows.slice(0, 10).map((row, i) => {
                            const isValid = row.url && row.title;
                            return (
                              <tr key={i} className={isValid ? "" : "bg-destructive/10"}>
                                <td className="px-3 py-1.5 truncate max-w-[150px]">{row.title || "-"}</td>
                                <td className="px-3 py-1.5 truncate max-w-[200px] text-muted-foreground">{row.url || "-"}</td>
                                <td className="px-3 py-1.5 truncate max-w-[100px]">{row.category || "-"}</td>
                                <td className="px-3 py-1.5">
                                  {isValid ? (
                                    <span className="text-green-600">Valid</span>
                                  ) : (
                                    <span className="text-destructive">Missing {!row.title ? "title" : "URL"}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {previewRows.length > 10 && (
                            <tr>
                              <td colSpan={4} className="px-3 py-1.5 text-center text-muted-foreground">
                                ... and {previewRows.length - 10} more rows
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkPasteOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkImport}
                  disabled={validPreviewRows.length === 0 || isPasting}
                  data-testid="button-import"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isPasting ? "Importing..." : `Import ${validPreviewRows.length} URL${validPreviewRows.length !== 1 ? 's' : ''}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Site URLs</CardTitle>
          </div>
          <CardDescription>
            Click any row to edit. Press Ctrl+V anywhere to paste from a spreadsheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={tableRef} className="border rounded-md overflow-hidden" tabIndex={0}>
            <div className="bg-muted/50 border-b grid grid-cols-12 text-sm font-medium sticky top-0">
              <div className="col-span-3 px-3 py-2 border-r">Title</div>
              <div className="col-span-4 px-3 py-2 border-r">URL</div>
              <div className="col-span-2 px-3 py-2 border-r">Category</div>
              <div className="col-span-2 px-3 py-2 border-r">Description</div>
              <div className="col-span-1 px-3 py-2 text-center">Actions</div>
            </div>

            <div className="max-h-[calc(100vh-380px)] overflow-y-auto">
              {isLoading ? (
                <div className="px-3 py-8 text-center text-muted-foreground">Loading...</div>
              ) : siteUrls.length === 0 ? (
                <div className="px-3 py-12 text-center text-muted-foreground space-y-2">
                  <p>No URLs added yet.</p>
                  <p className="text-sm">Click "Paste Multiple" or press Ctrl+V to import from a spreadsheet.</p>
                </div>
              ) : (
                <>
                  {siteUrls.map((url) => (
                    <div
                      key={url.id}
                      className="grid grid-cols-12 border-b last:border-b-0 group"
                      data-testid={`row-url-${url.id}`}
                      onKeyDown={handleKeyDown}
                    >
                      {editingId === url.id ? (
                        <>
                          <div className="col-span-3 border-r">
                            <Input
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="border-0 rounded-none h-10 focus-visible:ring-1 focus-visible:ring-inset"
                              placeholder="Page title"
                              autoFocus
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
