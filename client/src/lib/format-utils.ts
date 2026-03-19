export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "\u2014";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "\u2014";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "Never";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Never";
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getDeadlineInfo(requiredDate: string | null | undefined): { text: string; color: string; urgent: boolean } {
  if (!requiredDate) return { text: "No deadline", color: "text-muted-foreground", urgent: false };
  const d = new Date(requiredDate);
  if (isNaN(d.getTime())) return { text: "No deadline", color: "text-muted-foreground", urgent: false };
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, color: "text-red-600", urgent: true };
  if (diffDays === 0) return { text: "Due today", color: "text-red-600", urgent: true };
  if (diffDays === 1) return { text: "Due tomorrow", color: "text-orange-600", urgent: true };
  if (diffDays <= 3) return { text: `${diffDays}d left`, color: "text-orange-500", urgent: true };
  if (diffDays <= 7) return { text: `${diffDays}d left`, color: "text-yellow-600", urgent: false };
  return { text: formatDate(requiredDate), color: "text-muted-foreground", urgent: false };
}

export function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "available": return "outline";
    case "claimed": return "secondary";
    case "submitted": return "default";
    case "revision_requested": return "destructive";
    case "approved": return "default";
    case "paid": return "secondary";
    case "draft": return "outline";
    case "published": return "default";
    case "completed": return "default";
    case "active": return "default";
    case "planning": return "outline";
    case "paused": return "secondary";
    default: return "outline";
  }
}

export function getStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
