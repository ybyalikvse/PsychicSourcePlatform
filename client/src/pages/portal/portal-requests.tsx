import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState } from "@/components/data-state";
import { portalApiRequest, portalFetch } from "@/lib/portal-api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, DollarSign, Video } from "lucide-react";
import type { VideoRequest, Psychic } from "@shared/schema";

interface PortalRequestsProps {
  psychic: Psychic;
}

export default function PortalRequests({ psychic }: PortalRequestsProps) {
  const { toast } = useToast();

  const { data: requests, isLoading } = useQuery<VideoRequest[]>({
    queryKey: ["/api/portal/video-requests", "available"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/video-requests?status=available");
      return res.json();
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await portalApiRequest("POST", `/api/portal/video-requests/${requestId}/claim`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request claimed", description: "You have successfully claimed this video request." });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/video-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-requests"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to claim", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Available Requests</h1>
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
      <h1 className="text-2xl font-semibold" data-testid="text-page-title">Available Requests</h1>
      {!requests || requests.length === 0 ? (
        <DataState
          status="empty"
          title="No Available Requests"
          message="There are no video requests available at the moment. Check back later."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => (
            <Card key={req.id} data-testid={`card-request-${req.id}`}>
              <CardHeader>
                <CardTitle className="text-base" data-testid={`text-request-title-${req.id}`}>{req.title}</CardTitle>
                <CardDescription data-testid={`text-request-topic-${req.id}`}>{req.topic}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {req.hook && (
                  <p className="text-sm text-muted-foreground" data-testid={`text-request-hook-${req.id}`}>
                    {req.hook}
                  </p>
                )}
                {req.description && (
                  <p className="text-sm" data-testid={`text-request-description-${req.id}`}>
                    {req.description}
                  </p>
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
                  onClick={() => claimMutation.mutate(req.id)}
                  disabled={claimMutation.isPending}
                  data-testid={`button-claim-${req.id}`}
                >
                  <Video className="h-4 w-4" />
                  {claimMutation.isPending ? "Claiming..." : "Claim Request"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
