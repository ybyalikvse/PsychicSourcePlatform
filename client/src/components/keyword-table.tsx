import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Keyword } from "@shared/schema";

interface KeywordTableProps {
  keywords: Keyword[];
  isLoading?: boolean;
}

export function KeywordTable({ keywords, isLoading }: KeywordTableProps) {
  const getPositionChange = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return null;
    return previous - current;
  };

  const getDifficultyBadge = (difficulty: number | null | undefined) => {
    if (difficulty === null || difficulty === undefined) {
      return <span className="text-muted-foreground">--</span>;
    }
    const config = {
      className: cn(
        "font-mono text-xs",
        difficulty <= 30 && "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        difficulty > 30 && difficulty <= 60 && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
        difficulty > 60 && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      ),
    };
    return <Badge variant="outline" className={config.className}>{difficulty}</Badge>;
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "--";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <div className="p-8 text-center text-muted-foreground">
          Loading keywords...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border" data-testid="keyword-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Keyword</TableHead>
            <TableHead className="text-right">Position</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Difficulty</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">Impressions</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead>URL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No keywords tracked yet.
              </TableCell>
            </TableRow>
          ) : (
            keywords.map((keyword) => {
              const change = getPositionChange(keyword.currentPosition, keyword.previousPosition);
              return (
                <TableRow key={keyword.id} data-testid={`row-keyword-${keyword.id}`}>
                  <TableCell>
                    <span className="font-medium">{keyword.keyword}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono">
                        {keyword.currentPosition ?? "--"}
                      </span>
                      {change !== null && change !== 0 && (
                        <div className="flex items-center">
                          {change > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span
                            className={cn(
                              "text-xs font-mono ml-1",
                              change > 0 ? "text-green-500" : "text-red-500"
                            )}
                          >
                            {change > 0 ? `+${change}` : change}
                          </span>
                        </div>
                      )}
                      {change === 0 && (
                        <Minus className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(keyword.volume)}
                  </TableCell>
                  <TableCell className="text-right">
                    {getDifficultyBadge(keyword.difficulty)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(keyword.clicks)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(keyword.impressions)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {keyword.ctr || "--"}
                  </TableCell>
                  <TableCell>
                    {keyword.url ? (
                      <a
                        href={keyword.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground truncate max-w-[150px]"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{keyword.url.replace(/^https?:\/\//, '')}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
