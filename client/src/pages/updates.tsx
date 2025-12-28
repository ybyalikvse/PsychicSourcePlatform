import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  FileText,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@shared/schema";

interface ContentAuditItem {
  article: Article;
  issues: {
    type: "outdated" | "low_performance" | "missing_keywords" | "low_seo_score";
    description: string;
    priority: "high" | "medium" | "low";
  }[];
  lastUpdated: string;
  daysOld: number;
}

export default function Updates() {
  const { toast } = useToast();
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { data: auditItems = [], isLoading } = useQuery<ContentAuditItem[]>({
    queryKey: ["/api/content/audit"],
  });

  const refreshAuditMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/content/audit/refresh");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/audit"] });
      toast({
        title: "Audit refreshed",
        description: "Content audit has been updated.",
      });
    },
  });

  const filteredItems = auditItems.filter((item) => {
    if (priorityFilter === "all") return true;
    return item.issues.some((issue) => issue.priority === priorityFilter);
  });

  const getIssueBadge = (type: string) => {
    const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
      outdated: {
        icon: <Clock className="h-3 w-3" />,
        label: "Outdated",
        className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      },
      low_performance: {
        icon: <TrendingDown className="h-3 w-3" />,
        label: "Low Performance",
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      },
      missing_keywords: {
        icon: <AlertTriangle className="h-3 w-3" />,
        label: "Missing Keywords",
        className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      },
      low_seo_score: {
        icon: <AlertTriangle className="h-3 w-3" />,
        label: "Low SEO",
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      },
    };
    const cfg = config[type] || config.outdated;
    return (
      <Badge variant="outline" className={cfg.className}>
        {cfg.icon}
        <span className="ml-1">{cfg.label}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, string> = {
      high: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      low: "",
    };
    return (
      <Badge variant="outline" className={config[priority] || ""}>
        {priority}
      </Badge>
    );
  };

  const totalIssues = auditItems.reduce((sum, item) => sum + item.issues.length, 0);
  const highPriorityCount = auditItems.filter((item) =>
    item.issues.some((i) => i.priority === "high")
  ).length;

  return (
    <div className="space-y-6" data-testid="page-updates">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Content Updates</h1>
          <p className="text-muted-foreground">
            Identify and update content that needs attention
          </p>
        </div>
        <Button
          onClick={() => refreshAuditMutation.mutate()}
          disabled={refreshAuditMutation.isPending}
          data-testid="button-refresh-audit"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshAuditMutation.isPending ? "animate-spin" : ""}`} />
          Refresh Audit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{auditItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Issues Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalIssues}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Priority Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {highPriorityCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg">Content Audit Results</CardTitle>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-priority-filter">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading audit results...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-lg font-medium">All content is up to date!</p>
                <p className="text-sm">No issues found with your content.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredItems.map((item, index) => (
                  <div
                    key={item.article.id}
                    className="p-4 hover-elevate"
                    data-testid={`audit-item-${index}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{item.article.title}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Last updated {item.daysOld} days ago
                        </div>
                      </div>
                      <Button variant="outline" size="sm" data-testid={`button-optimize-${index}`}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Optimize
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {item.issues.map((issue, issueIndex) => (
                        <div
                          key={issueIndex}
                          className="flex items-center gap-3 text-sm"
                        >
                          {getIssueBadge(issue.type)}
                          <span className="flex-1 text-muted-foreground">
                            {issue.description}
                          </span>
                          {getPriorityBadge(issue.priority)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
