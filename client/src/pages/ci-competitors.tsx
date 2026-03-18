import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Loader2, Users, ArrowLeft, Play, CheckCircle, Clock } from "lucide-react";
import { Link } from "wouter";

interface Competitor {
  id: number;
  handle: string;
  displayName: string | null;
  platform: string;
  isActive: boolean;
  lastScrapedAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface CompetitorForm {
  handle: string;
  displayName: string;
  platform: string;
  notes: string;
}

const EMPTY_FORM: CompetitorForm = {
  handle: "",
  displayName: "",
  platform: "tiktok",
  notes: "",
};

export default function CiCompetitors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [formData, setFormData] = useState<CompetitorForm>(EMPTY_FORM);

  const [runningStep, setRunningStep] = useState<string | null>(null);

  const { data: competitors = [], isLoading } = useQuery<Competitor[]>({
    queryKey: ["/api/ci/competitors"],
  });

  const { data: pipelineStatus } = useQuery<Record<string, string | null>>({
    queryKey: ["/api/ci/pipeline/status"],
  });

  const runStepMutation = useMutation({
    mutationFn: async (step: string) => {
      const res = await apiRequest("POST", "/api/ci/pipeline/run-step", { step });
      return res.json();
    },
    onSuccess: (_data, step) => {
      toast({ title: `${step} completed` });
      queryClient.invalidateQueries({ queryKey: ["/api/ci"] });
      setRunningStep(null);
    },
    onError: (err: Error, step) => {
      toast({ title: `${step} failed`, description: err.message, variant: "destructive" });
      setRunningStep(null);
    },
  });

  function formatTimestamp(ts: string | null | undefined): string {
    if (!ts) return "Never";
    const d = new Date(ts);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }

  const createMutation = useMutation({
    mutationFn: async (data: CompetitorForm) => {
      const res = await apiRequest("POST", "/api/ci/competitors", {
        handle: data.handle,
        displayName: data.displayName || null,
        platform: data.platform,
        notes: data.notes || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ci/competitors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ci/stats"] });
      setShowAddDialog(false);
      setFormData(EMPTY_FORM);
      toast({ title: "Competitor added", description: "The competitor has been added successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add competitor", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CompetitorForm & { isActive: boolean }> }) => {
      const res = await apiRequest("PATCH", `/api/ci/competitors/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ci/competitors"] });
      setEditingCompetitor(null);
      setFormData(EMPTY_FORM);
      toast({ title: "Competitor updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update competitor", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ci/competitors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ci/competitors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ci/stats"] });
      toast({ title: "Competitor deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete competitor", description: err.message, variant: "destructive" });
    },
  });

  function openAddDialog() {
    setFormData(EMPTY_FORM);
    setShowAddDialog(true);
  }

  function openEditDialog(competitor: Competitor) {
    setEditingCompetitor(competitor);
    setFormData({
      handle: competitor.handle,
      displayName: competitor.displayName || "",
      platform: competitor.platform,
      notes: competitor.notes || "",
    });
  }

  function handleDelete(competitor: Competitor) {
    if (confirm(`Are you sure you want to delete @${competitor.handle}? This action cannot be undone.`)) {
      deleteMutation.mutate(competitor.id);
    }
  }

  function handleToggleActive(competitor: Competitor) {
    updateMutation.mutate({
      id: competitor.id,
      data: { isActive: !competitor.isActive },
    });
  }

  function formatDate(date: string | null): string {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/ci">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Competitors</h1>
            <p className="text-muted-foreground">Track and manage competitor accounts for content intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
            {pipelineStatus?.scrape ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
            Scrape: {formatTimestamp(pipelineStatus?.scrape)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setRunningStep("scrape"); runStepMutation.mutate("scrape"); }}
            disabled={!!runningStep}
          >
            {runningStep === "scrape" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
            Run Scrape
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setRunningStep("transcripts"); runStepMutation.mutate("transcripts"); }}
            disabled={!!runningStep}
          >
            {runningStep === "transcripts" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
            Run Transcripts
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Competitor
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : competitors.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Competitors Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add competitor accounts to start tracking their content.
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Competitor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Handle</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Last Scraped</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((competitor) => (
                <TableRow key={competitor.id}>
                  <TableCell className="font-medium">@{competitor.handle}</TableCell>
                  <TableCell>{competitor.displayName || "---"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {competitor.platform}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={competitor.isActive}
                      onCheckedChange={() => handleToggleActive(competitor)}
                      disabled={updateMutation.isPending}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(competitor.lastScrapedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(competitor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(competitor)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Competitor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Competitor</DialogTitle>
            <DialogDescription>
              Add a new competitor account to track in the content intelligence pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-handle">Handle *</Label>
              <Input
                id="add-handle"
                placeholder="username (without @)"
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-displayName">Display Name</Label>
              <Input
                id="add-displayName"
                placeholder="Creator display name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-platform">Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(val) => setFormData({ ...formData, platform: val })}
              >
                <SelectTrigger id="add-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                placeholder="Optional notes about this competitor..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.handle.trim() || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Competitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Competitor Dialog */}
      <Dialog open={!!editingCompetitor} onOpenChange={(open) => { if (!open) setEditingCompetitor(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Competitor</DialogTitle>
            <DialogDescription>
              Update the competitor account details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-handle">Handle *</Label>
              <Input
                id="edit-handle"
                placeholder="username (without @)"
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-displayName">Display Name</Label>
              <Input
                id="edit-displayName"
                placeholder="Creator display name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-platform">Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(val) => setFormData({ ...formData, platform: val })}
              >
                <SelectTrigger id="edit-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Optional notes about this competitor..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCompetitor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingCompetitor) {
                  updateMutation.mutate({
                    id: editingCompetitor.id,
                    data: {
                      handle: formData.handle,
                      displayName: formData.displayName || undefined,
                      platform: formData.platform,
                      notes: formData.notes || undefined,
                    },
                  });
                }
              }}
              disabled={!formData.handle.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
