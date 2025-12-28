import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Link2, RefreshCw, Database } from "lucide-react";
import { Link } from "wouter";

interface DataStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
}

interface DataStateProps {
  status: "error" | "empty" | "disconnected" | "loading";
  title: string;
  message: string;
  actions?: DataStateAction[];
  icon?: "error" | "connect" | "empty" | "loading";
  className?: string;
}

export function DataState({
  status,
  title,
  message,
  actions = [],
  icon,
  className = "",
}: DataStateProps) {
  const iconType = icon || (status === "disconnected" ? "connect" : status === "empty" ? "empty" : "error");

  const IconComponent = {
    error: AlertCircle,
    connect: Link2,
    empty: Database,
    loading: RefreshCw,
  }[iconType];

  const iconColorClass = {
    error: "text-destructive",
    connect: "text-primary",
    empty: "text-muted-foreground",
    loading: "text-muted-foreground animate-spin",
  }[iconType];

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className={`rounded-full p-3 bg-muted mb-4`}>
          <IconComponent className={`h-6 w-6 ${iconColorClass}`} />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md mb-6">{message}</p>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {actions.map((action, index) =>
              action.href ? (
                <Link key={index} href={action.href}>
                  <Button variant={action.variant || "default"} data-testid={`button-action-${index}`}>
                    {action.label}
                  </Button>
                </Link>
              ) : (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  onClick={action.onClick}
                  data-testid={`button-action-${index}`}
                >
                  {action.label}
                </Button>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InlineDataState({
  status,
  title,
  message,
  actions = [],
}: Omit<DataStateProps, "className">) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {status === "disconnected" && (
        <Link2 className="h-8 w-8 text-muted-foreground mb-3" />
      )}
      {status === "error" && (
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
      )}
      {status === "empty" && (
        <Database className="h-8 w-8 text-muted-foreground mb-3" />
      )}
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
      {actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map((action, index) =>
            action.href ? (
              <Link key={index} href={action.href}>
                <Button size="sm" variant={action.variant || "outline"}>
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button
                key={index}
                size="sm"
                variant={action.variant || "outline"}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
