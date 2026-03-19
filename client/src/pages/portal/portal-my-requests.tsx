import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState } from "@/components/data-state";
import { portalFetch } from "@/lib/portal-api";
import { Calendar, Clock, DollarSign, Eye, AlertTriangle, CheckCircle, RotateCw, Banknote } from "lucide-react";
import type { VideoRequest, Psychic } from "@shared/schema";
import { getDeadlineInfo, getStatusBadgeVariant, getStatusLabel } from "@/lib/format-utils";

interface PortalMyRequestsProps {
  psychic: Psychic;
}

// Status display now uses shared format-utils

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
            return (
              <Card key={req.id} data-testid={`card-my-request-${req.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base" data-testid={`text-my-request-title-${req.id}`}>
                      {req.title}
                    </CardTitle>
                    <Badge variant={getStatusBadgeVariant(req.status)} data-testid={`badge-status-${req.id}`}>
                      {getStatusLabel(req.status)}
                    </Badge>
                  </div>
                  <CardDescription>{req.topic}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {req.status === "revision_requested" && (
                    <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-2 flex items-center gap-2">
                      <RotateCw className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">Revision Requested — please re-upload your video</span>
                    </div>
                  )}
                  {req.status === "approved" && (
                    <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Approved!</span>
                    </div>
                  )}
                  {req.status === "paid" && (
                    <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-2 flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Paid</span>
                    </div>
                  )}
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
                    {req.requiredDate && (() => {
                      const deadline = getDeadlineInfo(req.requiredDate);
                      return (
                        <Badge variant="outline" className={`no-default-active-elevate ${deadline.color}`}>
                          {deadline.urgent ? (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          ) : (
                            <Calendar className="h-3 w-3 mr-1" />
                          )}
                          {deadline.text}
                        </Badge>
                      );
                    })()}
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
