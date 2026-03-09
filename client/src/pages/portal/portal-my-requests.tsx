import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState } from "@/components/data-state";
import { portalFetch } from "@/lib/portal-api";
import { Calendar, Clock, DollarSign, Eye } from "lucide-react";
import type { VideoRequest, Psychic } from "@shared/schema";

interface PortalMyRequestsProps {
  psychic: Psychic;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  claimed: { label: "Claimed", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  revision_requested: { label: "Revision Needed", variant: "destructive" },
  approved: { label: "Approved", variant: "outline" },
  paid: { label: "Paid", variant: "outline" },
};

export default function PortalMyRequests({ psychic }: PortalMyRequestsProps) {
  const [, setLocation] = useLocation();

  const { data: requests, isLoading } = useQuery<VideoRequest[]>({
    queryKey: ["/api/portal/my-requests"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/my-requests");
      return res.json();
    },
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">My Requests</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold" data-testid="text-page-title">My Requests</h1>
      {!requests || requests.length === 0 ? (
        <DataState
          status="empty"
          title="No Claimed Requests"
          message="You haven't claimed any video requests yet. Browse available requests to get started."
          actions={[{ label: "Browse Requests", href: "/portal/requests" }]}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => {
            const statusInfo = statusConfig[req.status] || { label: req.status, variant: "secondary" as const };
            return (
              <Card key={req.id} data-testid={`card-my-request-${req.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base" data-testid={`text-my-request-title-${req.id}`}>
                      {req.title}
                    </CardTitle>
                    <Badge variant={statusInfo.variant} data-testid={`badge-status-${req.id}`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <CardDescription>{req.topic}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {req.description && (
                    <p className="text-sm text-muted-foreground">{req.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {req.videoDuration && (
                      <Badge variant="outline" className="no-default-active-elevate">
                        <Clock className="h-3 w-3 mr-1" />
                        {req.videoDuration}
                      </Badge>
                    )}
                    {req.payAmount && (
                      <Badge variant="outline" className="no-default-active-elevate">
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${req.payAmount}
                      </Badge>
                    )}
                    {req.requiredDate && (
                      <Badge variant="outline" className="no-default-active-elevate">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(req.requiredDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => setLocation(`/portal/request/${req.id}`)}
                    data-testid={`button-details-${req.id}`}
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
