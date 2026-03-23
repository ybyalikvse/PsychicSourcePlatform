import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { portalFetch } from "@/lib/portal-api";
import { Video, ListChecks, CheckCircle, Banknote, ArrowRight } from "lucide-react";
import type { VideoRequest, Psychic } from "@shared/schema";

interface PortalDashboardProps {
  psychic: Psychic;
}

export default function PortalDashboard({ psychic }: PortalDashboardProps) {
  const [, setLocation] = useLocation();

  const { data: availableRequests, isLoading: loadingAvailable } = useQuery<VideoRequest[]>({
    queryKey: ["/api/portal/video-requests", "available"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/video-requests?status=available");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: myRequests, isLoading: loadingMy } = useQuery<VideoRequest[]>({
    queryKey: ["/api/portal/my-requests"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/my-requests");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const availableCount = availableRequests?.length ?? 0;
  const claimedCount = myRequests?.filter(r => r.status === "claimed" || r.status === "submitted" || r.status === "revision_requested").length ?? 0;
  const approvedCount = myRequests?.filter(r => r.status === "approved").length ?? 0;
  const paidCount = myRequests?.filter(r => r.status === "paid").length ?? 0;
  const revisionCount = myRequests?.filter(r => r.status === "revision_requested").length ?? 0;

  const isLoading = loadingAvailable || loadingMy;

  const stats = [
    {
      title: "Available Requests",
      value: availableCount,
      description: "Requests you can claim",
      icon: Video,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      action: () => setLocation("/portal/requests"),
    },
    {
      title: "In Progress",
      value: claimedCount,
      description: revisionCount > 0 ? `${revisionCount} need${revisionCount === 1 ? "s" : ""} revision` : "Claimed & submitted",
      icon: ListChecks,
      color: revisionCount > 0 ? "text-orange-600 dark:text-orange-400" : "text-purple-600 dark:text-purple-400",
      bgColor: revisionCount > 0 ? "bg-orange-50 dark:bg-orange-950" : "bg-purple-50 dark:bg-purple-950",
      action: () => setLocation("/portal/my-requests"),
    },
    {
      title: "Approved",
      value: approvedCount,
      description: "Videos approved by admin",
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
      action: () => setLocation("/portal/my-requests"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Status
        </h1>
        <p className="text-muted-foreground mt-1">An overview of your video requests.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={stat.action}
            data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-md p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid={`text-stat-value-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {revisionCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-orange-700 dark:text-orange-400">
                  {revisionCount} request{revisionCount !== 1 ? "s" : ""} need{revisionCount === 1 ? "s" : ""} revision
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">
                  Please review the feedback and re-upload your videos.
                </p>
              </div>
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => setLocation("/portal/my-requests")}
                data-testid="button-view-revisions"
              >
                View Requests
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
