import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function IntegrationCard({
  name,
  description,
  icon,
  status,
  lastSync,
  onConnect,
  onDisconnect,
  onSync,
  isSyncing,
}: IntegrationCardProps) {
  const statusConfig = {
    connected: {
      label: "Connected",
      icon: CheckCircle,
      className: "text-green-500",
      badgeVariant: "outline" as const,
    },
    disconnected: {
      label: "Disconnected",
      icon: XCircle,
      className: "text-muted-foreground",
      badgeVariant: "secondary" as const,
    },
    error: {
      label: "Error",
      icon: AlertCircle,
      className: "text-red-500",
      badgeVariant: "destructive" as const,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card data-testid={`integration-card-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant={config.badgeVariant} className="shrink-0">
          <StatusIcon className={cn("mr-1 h-3 w-3", config.className)} />
          {config.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {lastSync ? `Last synced: ${lastSync}` : "Never synced"}
          </div>
          <div className="flex items-center gap-2">
            {status === "connected" && onSync && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSync}
                disabled={isSyncing}
                data-testid={`button-sync-${name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              </Button>
            )}
            {status === "connected" && onDisconnect && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDisconnect}
                data-testid={`button-disconnect-${name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                Disconnect
              </Button>
            )}
            {status === "disconnected" && onConnect && (
              <Button
                size="sm"
                onClick={onConnect}
                data-testid={`button-connect-${name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect
              </Button>
            )}
            {status === "error" && onConnect && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onConnect}
                data-testid={`button-reconnect-${name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                Reconnect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
