import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { KeywordTable } from "@/components/keyword-table";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, RefreshCw, TrendingUp, Target, MousePointer } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Keyword } from "@shared/schema";

export default function Keywords() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: keywords = [], isLoading } = useQuery<Keyword[]>({
    queryKey: ["/api/keywords"],
  });

  const { data: stats } = useQuery<{
    totalKeywords: number;
    avgPosition: number;
    totalClicks: number;
    totalImpressions: number;
  }>({
    queryKey: ["/api/keywords/stats"],
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (keyword: string) => {
      return await apiRequest("POST", "/api/keywords", { keyword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      toast({
        title: "Keyword added",
        description: "The keyword has been added to tracking.",
      });
      setNewKeyword("");
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add keyword. Please try again.",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/keywords/sync");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      toast({
        title: "Sync complete",
        description: "Keywords have been updated from Google Search Console.",
      });
    },
    onError: () => {
      toast({
        title: "Sync failed",
        description: "Could not sync with Search Console. Check your connection.",
        variant: "destructive",
      });
    },
  });

  const filteredKeywords = keywords.filter((kw) =>
    !searchQuery || kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="page-keywords">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Keywords</h1>
          <p className="text-muted-foreground">
            Track keyword rankings and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-sync-keywords"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync from GSC
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-keyword">
                <Plus className="mr-2 h-4 w-4" />
                Add Keyword
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Keyword to Track</DialogTitle>
                <DialogDescription>
                  Enter a keyword to start tracking its rankings and performance.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="keyword">Keyword</Label>
                  <Input
                    id="keyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g., psychic reading online"
                    data-testid="input-new-keyword"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addKeywordMutation.mutate(newKeyword)}
                  disabled={!newKeyword || addKeywordMutation.isPending}
                  data-testid="button-confirm-add-keyword"
                >
                  {addKeywordMutation.isPending ? "Adding..." : "Add Keyword"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Tracked Keywords"
          value={stats?.totalKeywords ?? 0}
          icon={<Target className="h-4 w-4" />}
        />
        <MetricCard
          title="Avg. Position"
          value={stats?.avgPosition?.toFixed(1) ?? "--"}
          change={-1.2}
          changeLabel="vs last week"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Clicks"
          value={stats?.totalClicks?.toLocaleString() ?? "0"}
          change={8.5}
          changeLabel="vs last week"
          icon={<MousePointer className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Impressions"
          value={stats?.totalImpressions?.toLocaleString() ?? "0"}
          change={15.2}
          changeLabel="vs last week"
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg">Keyword Rankings</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-keywords"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <KeywordTable keywords={filteredKeywords} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
