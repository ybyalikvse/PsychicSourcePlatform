import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Eye, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Article } from "@shared/schema";

interface ContentTableProps {
  articles: Article[];
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onEdit: (article: Article) => void;
  onView: (article: Article) => void;
  onDelete: (article: Article) => void;
}

export function ContentTable({
  articles,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onEdit,
  onView,
  onDelete,
}: ContentTableProps) {
  const allSelected = articles.length > 0 && selectedIds.length === articles.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < articles.length;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      published: { variant: "default", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
      draft: { variant: "secondary", className: "" },
      archived: { variant: "outline", className: "text-muted-foreground" },
    };
    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSeoScoreBadge = (score: number | null | undefined) => {
    if (score === null || score === undefined) {
      return <span className="text-muted-foreground text-sm">--</span>;
    }
    const className = cn(
      "font-mono",
      score >= 80 && "text-green-600 dark:text-green-400",
      score >= 50 && score < 80 && "text-yellow-600 dark:text-yellow-400",
      score < 50 && "text-red-600 dark:text-red-400"
    );
    return <span className={className}>{score}</span>;
  };

  return (
    <div className="rounded-lg border" data-testid="content-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
                data-testid="checkbox-select-all"
                {...(someSelected ? { "data-state": "indeterminate" } : {})}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">SEO Score</TableHead>
            <TableHead className="text-right">Words</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No articles found.
              </TableCell>
            </TableRow>
          ) : (
            articles.map((article) => (
              <TableRow
                key={article.id}
                data-testid={`row-article-${article.id}`}
                className={cn(selectedIds.includes(article.id) && "bg-muted/50")}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(article.id)}
                    onCheckedChange={(checked) => onSelectOne(article.id, !!checked)}
                    aria-label={`Select ${article.title}`}
                    data-testid={`checkbox-article-${article.id}`}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{article.title}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      /{article.slug}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(article.status)}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {article.category || "--"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {getSeoScoreBadge(article.seoScore)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {article.wordCount?.toLocaleString() || 0}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-actions-${article.id}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(article)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(article)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(article)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
